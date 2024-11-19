import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { Profile, TokenType, UserStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('signup')
  async signup(@Body() body: SignupDto): Promise<Profile> {
    // DECOMPOSITION DU BODY
    let { email, firstname, lastname, password } = body;
    // VERIFICATION SI USER EXISTE DEJA
    const existingUser = await this.usersService.findOne({ email });
    if (existingUser) throw new ConflictException('Email already exists');
    // HASH DU MDP
    password = await bcrypt.hash(password, 10);
    // CREATION DE L'UTILISATEUR
    const user = await this.authService.create({
      email,
      password,
    });
    // GENERATION DU TOKEN DE VERIFICATION
    const verificationToken = uuidv4();
    // STOCKAGE EN DB
    await this.authService.saveToken(
      user.id,
      verificationToken,
      TokenType.VERIFICATION,
    );
    // ENVOI MAIL
    // ...
    // CREATION DU PROFIL
    return await this.usersService.createProfile({
      userId: user.id,
      firstname,
      lastname,
    });
  }

  @Post('signin')
  async signin(@Body() body: SigninDto): Promise<{
    message: string;
    user: {
      id: number;
    };
    access_token: string;
    refresh_token: string;
  }> {
    // VERIF SI USER EXISTE
    const user = await this.usersService.findOne({ email: body.email });
    if (!user) throw new UnauthorizedException('Bad credentials');
    // COMPARE PASSWORD
    const match = await bcrypt.compare(body.password, user.password);
    if (!match) throw new UnauthorizedException('Bad credentials');
    // VERIF USER STATUS
    if (user.status === UserStatus.BANNED)
      throw new UnauthorizedException('User banned');
    if (user.status === UserStatus.NOT_VERIFIED) {
      throw new UnauthorizedException(
        'User not verified, please check your mail',
      );
      // GENERATION DE LA CHAINE DE CARACTERE
      // STOCKAGE EN DB DANS TABLE TOKEN
      // ENVOI MAIL
    }
    // GENERATE TOKENS
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id },
      { expiresIn: '5m', secret: process.env.SECRET_KEY },
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      { expiresIn: '15m', secret: process.env.SECRET_KEY },
    );
    // VERIFY IF REFRESH TOKEN ALREADY EXISTS IN DB
    const existingRefreshToken = await this.authService.findToken(
      user.id,
      TokenType.REFRESH,
    );
    // HASH AND SAVE REFRESH TOKEN
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    if (existingRefreshToken) {
      await this.authService.updateToken(existingRefreshToken.id, hashedRefreshToken);
    } else {
      await this.authService.saveToken(
        user.id,
        hashedRefreshToken,
        TokenType.REFRESH,
      );
    }
    // RETURN TOKENS
    return {
      message: 'Utilisateur connecté avec succès',
      user: {
        id: user.id,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  // @Get()
  // findAll() {
  //   return this.authService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.authService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
  //   return this.authService.update(+id, updateAuthDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.authService.remove(+id);
  // }
}
