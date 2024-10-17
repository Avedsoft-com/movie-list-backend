import { Logger, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
import { S3 } from '@aws-sdk/client-s3';

@Module({
  providers: [StorageService, Logger],
  exports: [StorageService],
})
export class StorageModule {}
