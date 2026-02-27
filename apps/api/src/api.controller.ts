import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiService } from './api.service';

@Controller()
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Post('shorten')
  shortenURL(@Body('url') url: string) {
    return this.apiService.shortenURL(url);
  }

  @Get('{code}')
  getOriginalURL(@Param('code') code: string) {
    return this.apiService.getOriginalURL(code);
  }

  @Get('health')
  health() {
    return this.apiService.health();
  }

  @Get('metrics')
  metrics() {
    return this.apiService.metrics();
  }

}
