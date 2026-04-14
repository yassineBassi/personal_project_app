import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CodeParamDto } from './dto/code-param.dto';

@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('health')
  health() {
    return this.analyticsService.health();
  }

  @Get('dashboard')
  dashboard() {
    return this.analyticsService.dashboard();
  }

  @Get(':code([a-zA-Z0-9]{8})')
  getClickAnalytics(@Param() params: CodeParamDto) {
    return this.analyticsService.getClickAnalytics(params.code);
  }
}
