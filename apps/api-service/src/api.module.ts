import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Url } from '@app/database';
import { AppConfigModule, databaseConfig } from '@app/config';

@Module({
  controllers: [ApiController],
  providers: [ApiService],
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),
    TypeOrmModule.forFeature([Url]),
  ],
})
export class ApiModule {}
