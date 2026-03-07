import { All, Controller, Get, Req, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { GatewayService } from './gateway.service';
import { env } from 'process';

const SERVICES = {
  api: env.API_URL || 'http://localhost:3004',
  analytics: env.ANALYTICS_URL || 'http://localhost:3005',
};

@Controller()
export class GatewayController {
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
    console.log('Forwarding to analytics:', SERVICES.analytics);
    return this.forward(req, res, SERVICES.analytics);
  }

  private async forward(req: Request, res: Response, baseUrl: string) {
    let msPath = "/" + req.path.split('/').slice(2).join('/');
    const url = `${baseUrl}${msPath}`;
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
  }
}
