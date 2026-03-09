import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiService } from './api.service';
import type { Request } from 'express';

@Controller()
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Post('shorten')
  shortenURL(@Body('url') url: string) {
    return this.apiService.shortenURL(url);
  }

  @Get('health')
  health() {
    return this.apiService.health();
  }

  @Get('metrics')
  metrics() {
    return this.apiService.metrics();
  }

  @Get(':code')
  getOriginalURL(@Param('code') code: string, @Req() request: Request) {
    return this.apiService.getOriginalURL(code, request);
  }
}
