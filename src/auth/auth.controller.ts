import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  Patch,
  ParseIntPipe,
  Get,
  Res,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
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
      throw new ForbiddenException('Email already exists');
    // Hash password and create user with profile
    const user = await this.authService.createUserWithProfile({
      ...body,
      password: await bcrypt.hash(password, 10),
    });
    // Generate verification token, hash, save it in DB and send it
    await this.authService.generateHashSaveAndSendToken(
      user.id,
      TokenType.VERIFICATION,
      email,
    );
    const verificationToken = uuidv4();
    await this.authService.hashAndSaveToken(
      verificationToken,
      user.id,
      TokenType.VERIFICATION,
    );
    // Generate access token
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id },
      { expiresIn: '15m', secret: process.env.SECRET_KEY },
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
    if (!user) throw new NotFoundException('Bad credentials');
    // Compare passwords
    if (!(await bcrypt.compare(body.password, user.password)))
      throw new NotFoundException('Bad credentials');
    // Check user status
    if (user.status === UserStatus.BANNED)
      throw new ForbiddenException('User banned');
    // If user status === NOT_VERIFIED, send a new mail with new verification token
    if (!(await this.authService.isStatusVerified(user)))
      throw new BadRequestException('User not verified');
    // Generate tokens, hash refresh, save it in DB and send cookies
    await this.authService.generateTokensSaveRefreshAndSendCookies(
      user.id,
      res,
    );
    // Return user infos
    return {
      user: { id: user.id, pathPicture: user.pathPicture },
    };
  }

  @UseRefreshToken()
  @Post('me')
  async checkSession(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserIdWithAvatar> {
    // Retrieve refresh token from DB and check if it is expired
    const savedToken = await this.authService.findTokenAndCheckIfExpired(
      req.user.sub,
      TokenType.REFRESH,
    );
    // Throw error if no refresh token in DB
    if (!savedToken) throw new UnauthorizedException();
    // Throw error if compare tokens fails
    if (!(await bcrypt.compare(req.token, savedToken.token)))
      throw new UnauthorizedException();
    // Retrieve user
    const user = await this.usersService.findOne({ id: req.user.sub });
    // Check user status
    if (user.status === UserStatus.BANNED)
      throw new ForbiddenException('User banned');
    // Generate tokens, hash refresh, save it in DB and send cookies
    await this.authService.generateTokensSaveRefreshAndSendCookies(
      req.user.sub,
      res,
    );
    // Return user infos
    return {
      user: { id: user.id, pathPicture: user.pathPicture },
    };
  }

  @Post('logout')
  async logout(@Req() req: Request): Promise<string> {
    await this.authService.deleteToken(req.user.sub, TokenType.REFRESH);
    return 'User successfully logout';
  }

  @UseRefreshToken()
  @Post('refresh')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    // Retrieve refresh token from DB and check if it is expired
    const savedToken = await this.authService.findTokenAndCheckIfExpired(
      req.user.sub,
      TokenType.REFRESH,
    );
    // Throw error if no refresh token in DB
    if (!savedToken) throw new UnauthorizedException();
    // Throw error if compare tokens fails
    if (!(await bcrypt.compare(req.token, savedToken.token)))
      throw new UnauthorizedException();
    // Retrieve user
    const user = await this.usersService.findOne({ id: req.user.sub });
    // Check user status
    if (user.status === UserStatus.BANNED)
      throw new ForbiddenException('User banned');
    // Generate tokens, hash refresh, save it in DB and send cookies
    await this.authService.generateTokensSaveRefreshAndSendCookies(
      req.user.sub,
      res,
    );
    // Return tokens
    return 'Tokens successfully refresh';
  }

  @Public()
  @Get('user-verification/:userId/:verificationToken')
  async validateUser(
    @Param('verificationToken') verificationToken: string,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<string> {
    // Retrieve verification token from DB and check if it is expired
    const savedToken = await this.authService.findTokenAndCheckIfExpired(
      userId,
      TokenType.VERIFICATION,
    );
    // Throw error, generate new verification token and send it if no verification token in DB
    if (!savedToken) {
      const user = await this.usersService.findOne({ id: userId });
      if (!user) throw new NotFoundException();
      await this.authService.generateHashSaveAndSendToken(
        userId,
        TokenType.VERIFICATION,
        user.email,
      );
      throw new ForbiddenException();
    }
    // Throw error, generate new verification token and send it if compare fails
    if (!(await bcrypt.compare(verificationToken, savedToken.token))) {
      await this.authService.generateHashSaveAndSendToken(
        userId,
        TokenType.VERIFICATION,
        savedToken.email,
      );
      throw new ForbiddenException();
    }
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
    // Retrieve reset token from DB and check if it is expired
    const savedToken = await this.authService.findTokenAndCheckIfExpired(
      userId,
      TokenType.RESET_PASSWORD,
    );
    // Throw error, generate new reset password token and send it if no reset password token in DB
    if (!savedToken) {
      const user = await this.usersService.findOne({ id: userId });
      if (!user) throw new NotFoundException();
      await this.authService.generateHashSaveAndSendToken(
        userId,
        TokenType.RESET_PASSWORD,
        user.email,
      );
      throw new ForbiddenException();
    }
    // Throw error, generate new reset password token and send it if compare fails
    if (!(await bcrypt.compare(passwordResetToken, savedToken.token))) {
      await this.authService.generateHashSaveAndSendToken(
        userId,
        TokenType.RESET_PASSWORD,
        savedToken.email,
      );
      throw new ForbiddenException();
    }
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
