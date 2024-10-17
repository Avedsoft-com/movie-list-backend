import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
import { Tokens } from './types';
import { HttpStatusCode } from 'axios';
import { Public, GetAccessToken } from '../common/decorators';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('/register')
  @HttpCode(HttpStatusCode.Created)
  register(@Body() dto: CreateUserDto): Promise<Tokens> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('/login')
  @HttpCode(HttpStatusCode.Ok)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('/logout')
  @HttpCode(HttpStatusCode.Ok)
  logout(@GetAccessToken() accessToken: string) {
    return this.authService.logout(accessToken);
  }
}
