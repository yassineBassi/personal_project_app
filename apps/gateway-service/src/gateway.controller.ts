import { All, Controller, Get, HttpStatus, Logger, Req, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Counter, Histogram } from 'prom-client';
import { GatewayService } from './gateway.service';
import { env } from 'process';

const SERVICES = {
  api: env.API_URL || 'http://localhost:3001',
  analytics: env.ANALYTICS_URL || 'http://localhost:3002',
};

@Controller()
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly gatewayService: GatewayService,
    @InjectMetric('gateway_http_requests_total') private readonly requestsCounter: Counter<string>,
    @InjectMetric('gateway_http_request_duration_seconds') private readonly requestDuration: Histogram<string>,
  ) {}

  @Get('/health')
  async healthCheck(@Res() res: Response) {
    this.gatewayService.healthCheck(res);
  }

  @All('api/*')
  async forwardToApi(@Req() req: Request, @Res() res: Response) {
    return this.forward(req, res, SERVICES.api, 'api');
  }

  @All('analytics/*')
  async forwardToAnalytics(@Req() req: Request, @Res() res: Response) {
    this.logger.log(`Forwarding to analytics: ${SERVICES.analytics}`);
    return this.forward(req, res, SERVICES.analytics, 'analytics');
  }

  private async forward(req: Request, res: Response, baseUrl: string, service: string) {
    this.logger.log("------------------------------------------")

    if (req.method === 'OPTIONS') {
      res.status(HttpStatus.NO_CONTENT).send();
      return;
    }

    const msPath = '/' + req.path.split('/').slice(2).join('/');
    const url = `${baseUrl}${msPath}`;

    this.logger.log(`Gateway request - ${req.method} ${url}`);

    const gatewayIp = req.socket.localAddress;
    this.logger.log("Gateway IP : " + gatewayIp)

    const existingForwardedFor = req.headers['x-forwarded-for'];
    const xForwardedFor = existingForwardedFor
      ? `${existingForwardedFor}, ${gatewayIp}`
      : gatewayIp;

    const stopTimer = this.requestDuration.startTimer({ method: req.method, endpoint: msPath, nodeIp: gatewayIp, service });

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: req.method,
          url,
          data: req.body,
          headers: {
            'x-forwarded-for': xForwardedFor,
            'user-agent': req.headers['user-agent'],
            'Content-Type': 'application/json'
          },
          params: req.query,
        }),
      );
      stopTimer();
      this.requestsCounter.inc({ method: req.method, endpoint: msPath, nodeIp: gatewayIp,service, status_code: String(response.status) });
      const contentType = response.headers['content-type'];
      if (contentType) res.set('Content-Type', contentType);
      res.status(response.status).send(response.data);
      this.logger.log("Response Data: " + response.data)
      this.logger.log("------------------------------------------")
    } catch (e) {
      stopTimer();
      if (!e.status) {
        this.logger.error(`Upstream connection error: ${e.code}`, e.cause);
        this.requestsCounter.inc({ method: req.method, endpoint: msPath, nodeIp: gatewayIp, service, status_code: '503' });
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(e.code);
      } else {
        this.logger.warn(`Upstream responded with ${e.status}`, e.response?.data);
        this.requestsCounter.inc({ method: req.method, endpoint: msPath, nodeIp: gatewayIp, service, status_code: String(e.status) });
        res.status(e.status).json(e.response.data);
      }
      this.logger.log("Error")
      this.logger.log("------------------------------------------")
    }
  }
}
