import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrometheusModule, makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';

@Module({
  imports: [
    HttpModule,
    PrometheusModule.register({ defaultMetrics: { enabled: true } }),
  ],
  providers: [
    GatewayService,
    makeCounterProvider({
      name: 'gateway_http_requests_total',
      help: 'Total HTTP requests forwarded by the gateway',
      labelNames: ['method', 'service', 'status_code'],
    }),
    makeHistogramProvider({
      name: 'gateway_http_request_duration_seconds',
      help: 'Duration of HTTP requests forwarded by the gateway (seconds)',
      labelNames: ['method', 'service'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    }),
  ],
  controllers: [GatewayController],
})
export class GatewayModule {}
