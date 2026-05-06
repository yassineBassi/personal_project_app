import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { MetricsInterceptor } from './metrics.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Url } from '@app/database';
import { AppConfigModule, databaseConfig } from '@app/config';
import { UrlClick } from '@app/database/entities/url_click.entity';
import { PrometheusModule, makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    AppConfigModule,
    PrometheusModule.register({ defaultMetrics: { enabled: true } }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),
    TypeOrmModule.forFeature([Url, UrlClick]),
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    MetricsInterceptor,
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
    makeCounterProvider({
      name: 'analytics_requests_total',
      help: 'Total number of requests to the analytics service',
      labelNames: ['endpoint'],
    }),
    makeHistogramProvider({
      name: 'analytics_request_duration_seconds',
      help: 'Duration of analytics requests in seconds',
      labelNames: ['endpoint'],
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    }),
  ],
})
export class AnalyticsModule {}
