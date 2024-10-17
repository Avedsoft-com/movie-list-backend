import { Logger, Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { StorageService } from 'src/storage/storage.service';

@Module({
  providers: [MoviesService, StorageService, Logger],
  controllers: [MoviesController],
})
export class MoviesModule {}
