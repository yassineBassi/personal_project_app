import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':code')
  getClickAnalytics(@Param('code') code: string) {
    return this.analyticsService.getClickAnalytics(code);
  }

  @Get('health')
  health() {
    return this.analyticsService.health();
  }

  @Get('dashboard')
  dashboard() {
    return this.analyticsService.dashboard();
  }
  
}
