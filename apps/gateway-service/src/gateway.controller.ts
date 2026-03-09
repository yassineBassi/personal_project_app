import { All, Controller, Get, HttpStatus, Logger, Req, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { GatewayService } from './gateway.service';
import { env } from 'process';

const SERVICES = {
  api: env.API_URL || 'http://localhost:3001',
  analytics: env.ANALYTICS_URL || 'http://localhost:3002',
};

@Controller()
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(private readonly httpService: HttpService, private readonly gatewayService: GatewayService) {}

  @Get('/health')
  async healthCheck(@Res() res: Response) {
    this.gatewayService.healthCheck(res);
  }

  @All('api/*')
  async forwardToApi(@Req() req: Request, @Res() res: Response) {
    return this.forward(req, res, SERVICES.api);
  }

  @All('analytics/*')
  async forwardToAnalytics(@Req() req: Request, @Res() res: Response) {
    this.logger.log(`Forwarding to analytics: ${SERVICES.analytics}`);
    return this.forward(req, res, SERVICES.analytics);
  }

  private async forward(req: Request, res: Response, baseUrl: string) {
    this.logger.log("------------------------------------------")

    const msPath = '/' + req.path.split('/').slice(2).join('/');
    const url = `${baseUrl}${msPath}`;

    this.logger.log(`Gateway request - ${req.method} ${url}`);    
    this.logger.log("Request Headers", req.headers)
    
    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: req.method,
          url,
          data: req.body,
          headers: { 'Content-Type': 'application/json' },
          params: req.query,
        }),
      );
      res.status(response.status).json(response.data);
    } catch (e) {
      if (!e.status) {
        this.logger.error(`Upstream connection error: ${e.code}`, e.cause);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(e.code);
      } else {
        this.logger.warn(`Upstream responded with ${e.status}`, e.response?.data);
        res.status(e.status).json(e.response.data);
      }
    }
  }
}
