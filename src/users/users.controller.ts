import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { HttpStatusCode } from 'axios';
import { GetCurrentUserId } from '../common/decorators';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @HttpCode(HttpStatusCode.Ok)
  findUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatusCode.Ok)
  update(
    @GetCurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, updateUserDto, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatusCode.NoContent)
  remove(
    @GetCurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.remove(id, userId);
  }

  @Get('me')
  @HttpCode(HttpStatusCode.Ok)
  getMyProfile(@GetCurrentUserId() userId: number) {
    return this.usersService.getMyProfile(userId);
  }
}
