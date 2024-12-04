import {
  Controller,
  Post,
  Body,
  Param,
  ConflictException,
  UnauthorizedException,
  Req,
  Patch,
  ParseIntPipe,
  Get,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Public } from './decorators/public.decorator';
import { SigninDto } from './dtos/signin.dto';
import { SignupDto } from './dtos/signup.dto';
import { TokenType, User, UserStatus } from '@prisma/client';
import { UserIdWithAvatar } from './interfaces/UserIdWithAvatar';
import { EmailService } from 'src/email/email.service';
import { UseRefreshToken } from './decorators/useRefreshToken.decorator';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  @Public()
  @Post('signup')
  async signup(
    @Body() body: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<User> {
    // Body destructuring
    const { email, password } = body;
    // Check if email already exists
    if (await this.usersService.findOne({ email }))
      throw new ConflictException('Email already exists');
    // Hash password and create user with profile
    const user = await this.authService.createUserWithProfile({
      ...body,
      password: await bcrypt.hash(password, 10),
    });
    // Generate verification token, hash and save it in DB
    const verificationToken = uuidv4();
    await this.authService.hashAndSaveToken(
      verificationToken,
      user.id,
      TokenType.VERIFICATION,
    );
    // Send confirmation mail
    await this.emailService.sendMail(email, verificationToken, user.id);
    // Generate access token
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id },
      { expiresIn: '5m' },
    );
    // Create cookie and send it
    await this.authService.sendCookie(res, 'accessToken', accessToken);
    // Return user
    return user;
  }

  @Public()
  @Post('signin')
  async signin(
    @Body() body: SigninDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserIdWithAvatar> {
    // Check if user exists
    const user = await this.usersService.findOne({ email: body.email });
    if (!user) throw new UnauthorizedException('Bad credentials');
    // Compare passwords
    if (!(await bcrypt.compare(body.password, user.password)))
      throw new UnauthorizedException('Bad credentials');
    // Check user status
    await this.authService.checkUserStatus(user.status, user.id);
    // Generate tokens
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id },
      { expiresIn: '5m' },
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      { expiresIn: '15m' },
    );
    // Hash and save it in DB
    await this.authService.hashAndSaveToken(
      refreshToken,
      user.id,
      TokenType.REFRESH,
    );
    // Create cookies and send it
    await this.authService.sendCookie(res, 'accessToken', accessToken);
    await this.authService.sendCookie(res, 'refreshToken', refreshToken);
    // Return user infos
    return {
      user: { id: user.id, pathPicture: user.pathPicture },
    };
  }

  @UseRefreshToken()
  @Post('refresh')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    // Retrieve refresh token from DB
    const savedToken = await this.authService.findToken(
      req.user.sub,
      TokenType.REFRESH,
    );
    // Throw error if no refresh token in DB
    if (!savedToken) throw new UnauthorizedException();
    // Compare tokens
    if (!bcrypt.compare(savedToken.token, req.token))
      throw new UnauthorizedException();
    // Generate tokens
    const accessToken = await this.jwtService.signAsync(
      { sub: req.user.sub },
      { expiresIn: '5m' },
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: req.user.sub },
      { expiresIn: '15m' },
    );
    // Hash and save it in DB
    await this.authService.hashAndSaveToken(
      refreshToken,
      req.user.sub,
      TokenType.REFRESH,
    );
    await this.authService.sendCookie(res, 'accessToken', accessToken);
    await this.authService.sendCookie(res, 'refreshToken', refreshToken);
    // Return tokens
    return 'Tokens successfully refresh';
  }

  @Public()
  @Get('user-verification/:userId/:verificationToken')
  async validateUser(
    @Param('verificationToken') verificationToken: string,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<string> {
    // Retrieve verification token from DB
    const savedToken = await this.authService.findToken(
      userId,
      TokenType.VERIFICATION,
    );
    // Throw error if no verification token in DB
    if (!savedToken) throw new UnauthorizedException();
    // Throw error and generate new verification token if expired
    await this.authService.checkIfTokenExpired(
      savedToken,
      TokenType.VERIFICATION,
    );
    // Compare tokens
    if (!(await bcrypt.compare(verificationToken, savedToken.token)))
      throw new UnauthorizedException();
    // Edit user status
    await this.usersService.updateStatus(userId, UserStatus.VERIFIED);
    await this.authService.deleteToken(userId, TokenType.VERIFICATION);
    // Return success message
    return 'User validated';
  }

  @Public()
  @Post('forgot')
  async forgotPassword(@Body() body: { email: string }): Promise<string> {
    // Retrieve user with email
    const user = await this.usersService.findOne(body);
    // Throw fake success if no user in DB
    if (!user) return 'Email with instructions send, please check your mails';
    // Generate reset token
    const passwordResetToken = uuidv4();
    // Hash and save it in DB
    await this.authService.hashAndSaveToken(
      passwordResetToken,
      user.id,
      TokenType.RESET_PASSWORD,
    );
    // Send mail with password reset token and userId
    await this.emailService.sendMail(
      user.email,
      passwordResetToken,
      user.id,
      false,
    );
    // Return success message
    return 'Email with instructions send, please check your mails';
  }

  @Public()
  @Patch('reset-password/:userId/:passwordResetToken')
  async resetPassword(
    @Body() body: { password: string },
    @Param('passwordResetToken') passwordResetToken: string,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<string> {
    // Retrieve reset token from DB
    const savedToken = await this.authService.findToken(
      userId,
      TokenType.RESET_PASSWORD,
    );
    // Throw error if no reset token in DB
    if (!savedToken) throw new UnauthorizedException();
    // Throw error and generate new password reset token if expired
    await this.authService.checkIfTokenExpired(
      savedToken,
      TokenType.RESET_PASSWORD,
    );
    // Compare tokens
    if (!(await bcrypt.compare(passwordResetToken, savedToken.token)))
      throw new UnauthorizedException();
    // Edit user password
    await this.usersService.resetPassword(
      userId,
      await bcrypt.hash(body.password, 10),
    );
    await this.authService.deleteToken(userId, TokenType.RESET_PASSWORD);
    // Return success message
    return 'Password reset successfully';
  }
}
