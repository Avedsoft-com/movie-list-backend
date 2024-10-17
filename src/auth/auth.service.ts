import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/auth.dto';
import { compareSync, hashSync } from 'bcrypt';
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';
import * as process from 'process';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto): Promise<Tokens> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ForbiddenException('Email is already in use');
    }

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashSync(dto.password, +process.env.HASH_PASSWORD_SALT),
      },
    });

    const tokens = await this.getTokens(newUser.id, newUser.email);

    await this.prisma.tokens.create({
      data: {
        user_id: newUser.id,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: new Date(Date.now() + 60 * 60 * 24 * 1000),
      },
    });
    await this.updateRtHash(
      newUser.id,
      tokens.accessToken,
      tokens.refreshToken,
    );
    return tokens;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundException('Email is not registered');
    }
    const isPasswordValid = compareSync(dto.password, user.password);
    if (!isPasswordValid) {
      throw new ForbiddenException('Invalid password');
    }
    const tokens = await this.getTokens(user.id, user.email);
    await this.prisma.tokens.create({
      data: {
        user_id: user.id,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: new Date(Date.now() + 60 * 60 * 24 * 1000),
      },
    });
    await this.updateRtHash(user.id, tokens.accessToken, tokens.refreshToken);
    return {
      ...tokens,
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async logout(accessToken: string) {
    await this.prisma.tokens.deleteMany({
      where: {
        access_token: accessToken,
      },
    });
  }

  async refresh(user_id: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: user_id },
    });
    const userToken = await this.prisma.tokens.findFirst({
      where: {
        user_id: user_id,
        refresh_token: refreshToken,
      },
    });
    if (!userToken.user_id || !userToken.refresh_token) {
      throw new ForbiddenException('User not found');
    }
    const isRefreshTokenValid =
      userToken.refresh_token ===
      hashSync(refreshToken, userToken.refresh_token);
    if (!isRefreshTokenValid) {
      throw new ForbiddenException('Invalid refresh token');
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(
      userToken.user_id,
      tokens.accessToken,
      tokens.refreshToken,
    );
    return tokens;
  }

  async getTokens(user_id: number, email: string): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { user_id },
        {
          secret: process.env.JWT_ACCESS_SECRET,
          expiresIn: 60 * 60 * 24,
        },
      ),
      this.jwtService.signAsync(
        { user_id },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: 60 * 60 * 24 * 30,
        },
      ),
    ]);

    return { accessToken: at, refreshToken: rt };
  }

  hashData(data: string) {
    return hashSync(data, +process.env.HASH_PASSWORD_SALT);
  }

  async updateRtHash(user_id: number, at: string, rt: string) {
    const hash = this.hashData(rt);
    await this.prisma.tokens.updateMany({
      where: {
        user_id: user_id,
        access_token: at,
      },
      data: { refresh_token: hash },
    });
  }
}
