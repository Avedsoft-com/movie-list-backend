import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateMovieDto } from './dto/create-movie.dto';
import { GetCurrentUserId, Public } from 'src/common/decorators';

@Controller('movies')
export class MoviesController {
  constructor(private readonly service: MoviesService) {}

  @Get()
  getMovies(@GetCurrentUserId() userId: number) {
    return this.service.getMovies(userId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: null }))
  createMovie(
    @UploadedFile() file: Express.Multer.File,
    @Body() data: CreateMovieDto,
    @GetCurrentUserId() userId: number,
  ) {
    return this.service.createMovie(data, file, userId);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', { storage: null }))
  updateMovie(
    id: number,
    @Body() data: CreateMovieDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.updateMovie(id, data, file);
  }
}
