import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiService } from './api.service';
import type { Request } from 'express';
import { ShortenUrlDto } from './dto/shorten-url.dto';
import { CodeParamDto } from './dto/code-param.dto';

@Controller()
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Post('shorten')
  shortenURL(@Body() body: ShortenUrlDto) {
    return this.apiService.shortenURL(body.url);
  }

  @Get(':code')
  getOriginalURL(@Param() params: CodeParamDto, @Req() request: Request) {
    return this.apiService.getOriginalURL(params.code, request);
  }
  

  @Get('health')
  health() {
    return this.apiService.health();
  }
}
