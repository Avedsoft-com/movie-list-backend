import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { compareSync, hashSync } from 'bcrypt';
import * as process from 'process';
import { log } from 'console';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        updated_at: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return {
      ...user,
    };
  }

  async update(userId: number, updateUserDto: UpdateUserDto, id: number) {
    if (userId !== id) {
      throw new ForbiddenException('You are not allowed to update this user');
    }
    const userExists = await this.prisma.user.findMany({
      where: {
        OR: [{ email: updateUserDto.email }, { name: updateUserDto.name }],
      },
    });

    userExists.forEach((user) => {
      if (user.id !== userId && user.email === updateUserDto.email) {
        throw new ForbiddenException('Email already exists');
      }
      if (user.id !== userId && user.name === updateUserDto.name) {
        throw new ForbiddenException('Username already exists');
      }
    });

    if (updateUserDto.password) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      updateUserDto.password = hashSync(
        updateUserDto.password,
        +process.env.HASH_PASSWORD_SALT,
      );

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isOldPasswordValid = compareSync(
        updateUserDto.old_password,
        user.password,
      );

      if (!isOldPasswordValid) {
        throw new ForbiddenException('Invalid old password');
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: updateUserDto.password,
        },
      });

      delete updatedUser.password;

      return updatedUser;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateUserDto,
        updated_at: new Date(),
      },
    });
    delete user.password;
    return user;
  }

  async remove(id: number, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return this.prisma.user.delete({ where: { id } });
  }

  async getMyProfile(userId: number) {
    if (!userId) throw new NotFoundException('Token is not valid');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        updated_at: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      ...user,
    };
  }
}
