import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Counter, Histogram } from 'prom-client';
import { Observable, finalize } from 'rxjs';
import type { Request } from 'express';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('analytics_requests_total') private readonly requestsCounter: Counter<string>,
    @InjectMetric('analytics_request_duration_seconds') private readonly requestDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const routePath: string = request.route?.path ?? request.path;
    const method = request.method;

    if (routePath === '/metrics') {
      return next.handle();
    }

    const endpoint = `${method} ${routePath}`;
    const stopTimer = this.requestDuration.startTimer({ endpoint });

    return next.handle().pipe(
      finalize(() => {
        this.requestsCounter.inc({ endpoint });
        stopTimer();
      }),
    );
  }
}
