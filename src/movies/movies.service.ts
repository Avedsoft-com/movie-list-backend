import { Injectable } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { StorageService } from 'src/storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MoviesService {
  constructor(
    private readonly configService: ConfigService,
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  async getMovies(userId: number) {
    return this.prisma.movie.findMany({
      where: { user_id: userId },
    });
  }

  async createMovie(
    data: CreateMovieDto,
    file: Express.Multer.File,
    userId: number,
  ) {
    const fileUrl = await this.addFileToBucket(file);
    const movie = await this.prisma.movie.create({
      data: {
        title: data.title,
        year: Number(data.year),
        cover: fileUrl,
        user_id: userId,
      },
    });
    return movie;
  }

  async updateMovie(
    id: number,
    data: CreateMovieDto,
    file: Express.Multer.File,
  ) {
    const fileUrl = await this.addFileToBucket(file);
    const movie = await this.prisma.movie.update({
      where: { id: id },
      data: {
        title: data.title,
        year: Number(data.year),
        cover: fileUrl,
      },
    });
    return movie;
  }

  async addFileToBucket(file: Express.Multer.File) {
    const bucket = this.configService.get('aws.bucket');
    const fileName = `${uuidv4()}${extname(file.originalname)}`;
    const key = 'images/' + fileName;
    await this.storage.uploadFile(bucket, key, file.buffer);
    const fileUrl = `https://${bucket}.s3.eu-north-1.amazonaws.com/${key}`;
    return fileUrl;
  }
}
