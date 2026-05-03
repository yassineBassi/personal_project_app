import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { MetricsInterceptor } from './metrics.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Url } from '@app/database';
import { AppConfigModule, databaseConfig } from '@app/config';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { UrlClick } from '@app/database/entities/url_click.entity';
import { PrometheusModule, makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

@Module({
  controllers: [ApiController],
  providers: [
    ApiService,
    MetricsInterceptor,
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
    makeCounterProvider({
      name: 'api_requests_total',
      help: 'Total number of requests to the api service',
      labelNames: ['endpoint'],
    }),
    makeHistogramProvider({
      name: 'api_request_duration_seconds',
      help: 'Duration of api requests in seconds',
      labelNames: ['endpoint'],
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    }),
    makeCounterProvider({
      name: 'api_urls_shortened_total',
      help: 'Total number of URLs shortened',
    }),
    makeCounterProvider({
      name: 'api_url_resolves_total',
      help: 'Total number of URL resolve requests',
    }),
    makeCounterProvider({
      name: 'api_cache_lookups_total',
      help: 'Total number of Redis cache lookups for URL resolution',
      labelNames: ['result'],
    }),
    makeCounterProvider({
      name: 'api_url_not_found_total',
      help: 'Total number of URL resolve requests that returned 404',
    }),
  ],
  imports: [
    AppConfigModule,
    PrometheusModule.register({ defaultMetrics: { enabled: true } }),
    CacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        stores: [
          new KeyvRedis(
            `redis://${configService.get('REDIS_HOST')}:${configService.get('REDIS_PORT')}`,
            {
              socket: {
                connectTimeout: 500,
                reconnectStrategy: (retries: number) =>
                  retries > 3 ? new Error('Redis unavailable') : Math.min(retries * 100, 500),
              },
            },
          ),
        ],
        ttl: configService.get<number>('CACHE_TTL', 3600) * 1000,
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),
    TypeOrmModule.forFeature([Url, UrlClick]),
  ],
})
export class ApiModule {}
