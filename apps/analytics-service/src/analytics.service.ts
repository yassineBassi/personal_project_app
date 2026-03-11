import { Url } from '@app/database';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AnalyticsService {

  constructor(@InjectRepository(Url) private readonly urlRepository: Repository<Url>) {}

  async getClickAnalytics(code: string) {
    const urlObject = await this.urlRepository.findOneBy({code});
    if(!urlObject){
      throw new HttpException('URL not found', 404)
    }
    return {
      code: urlObject.code,
      clickCount: urlObject.clicks.length,
      clicks: urlObject.clicks
    }
  }

  health() {
    return 'OK';
  }

  dashboard() {
  }
    
}
