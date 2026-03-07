import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  
  constructor() {}

  getClickAnalytics(code: string) {
  }

  health() {
    return 'OK';
  }

  dashboard() {
  }
    
}
