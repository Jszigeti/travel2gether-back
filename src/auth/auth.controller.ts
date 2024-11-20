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
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Public } from './decorators/public.decorator';
import { SigninDto } from './dtos/signin.dto';
import { SignupDto } from './dtos/signup.dto';
import { Profile, TokenType, UserStatus } from '@prisma/client';
import { UserIdWithTokens } from './interfaces/UserIdWithTokens';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @Post('signup')
  async signup(@Body() body: SignupDto): Promise<Profile> {
    // Body destructuring
    const { email, firstname, lastname, password } = body;
    // Check if email already exists
    if (await this.usersService.findUser({ email }))
      throw new ConflictException('Email already exists');
    // Password hash and create user
    const user = await this.authService.createUser({
      email,
      password: await bcrypt.hash(password, 10),
    });
    // Generate verification token, hash and save it in DB
    const verificationToken = uuidv4();
    await this.authService.hashAndSaveToken(
      verificationToken,
      user.id,
      TokenType.VERIFICATION,
    );
    // Send mail with verification token and userId
    // ...
    // Create profile
    return await this.usersService.createProfile({
      userId: user.id,
      firstname,
      lastname,
    });
  }

  @Public()
  @Post('signin')
  async signin(@Body() body: SigninDto): Promise<UserIdWithTokens> {
    // Check if user exists
    const user = await this.usersService.findUser({ email: body.email });
    if (!user) throw new UnauthorizedException('Bad credentials');
    // Compare passwords
    if (!(await bcrypt.compare(body.password, user.password)))
      throw new UnauthorizedException('Bad credentials');
    // Check user status
    await this.authService.checkUserStatus(user.status, user.id);
    // Generate refresh token
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
    // Return tokens
    return {
      user: { id: user.id },
      access_token: await this.jwtService.signAsync(
        { sub: user.id },
        { expiresIn: '5m' },
      ),
      refresh_token: refreshToken,
    };
  }

  @Post('refresh')
  async refreshToken(@Req() req: Request): Promise<UserIdWithTokens> {
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
    // Generate refresh token
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
    // Return tokens
    return {
      user: { id: req.user.sub },
      access_token: await this.jwtService.signAsync(
        { sub: req.user.sub },
        { expiresIn: '5m' },
      ),
      refresh_token: refreshToken,
    };
  }

  @Public()
  @Post('user-verification/:userId/:verificationToken')
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
    await this.usersService.editUserStatus(
      savedToken.userId,
      UserStatus.VERIFIED,
    );
    // Return success message
    return 'User validated';
  }

  @Public()
  @Post('forgot')
  async forgotPassword(@Body() body: { email: string }): Promise<string> {
    // Retrieve user with email
    const user = await this.usersService.findUser(body);
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
    // ...
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
    await this.usersService.resetUserPassword(
      savedToken.userId,
      await bcrypt.hash(body.password, 10),
    );
    // Return success message
    return 'Password reset successfully';
  }
}
