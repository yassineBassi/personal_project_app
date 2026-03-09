import { Url } from '@app/database';
import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as UUID } from 'uuid';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Request } from 'express';

@Injectable()
export class ApiService {

  private readonly logger = new Logger(ApiService.name);
  private sqsClient: SQSClient;

  constructor(
    @InjectRepository(Url) private urlsRepository: Repository<Url>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject() private readonly configService: ConfigService
  ) {
    this.sqsClient = new SQSClient({
      region: configService.get('AWS_REGION'),
    });
  }

  async shortenURL(url: string) {
    this.logger.log(`Shortening URL: ${url}`);

    const urlObject = {
      originalUrl: url,
      code: UUID().slice(0, 8),
      clickCount: 0
    };

    await this.urlsRepository.save(urlObject);
    this.logger.log(`URL saved with code: ${urlObject.code}`);

    return {
      code: urlObject.code
    };
  }

  async incrementClickCount(code: string, request: Request) {
    const url = this.configService.get('CLICKS_QUEUE_URL');

    this.logger.log('SQS Url : ', url)

    const urlObject = await this.urlsRepository.findOne({where: {code}});
    if(urlObject){
      const command = new SendMessageCommand({
        QueueUrl: url,
        MessageBody: JSON.stringify({code, timestamp: new Date()})
      });
      const response = await this.sqsClient.send(command);
      console.log(response)
    }

    return urlObject;
  }

  async getOriginalURL(code: string, request: Request) {
    this.logger.log(`Resolving URL for code: ${code}`);
    this.logger.log("Request Headers", request.headers)

    const cached = await this.cacheManager.get<string>(code);
    if (cached) {
      this.logger.debug(`Cache hit for code: ${code}`);
      this.incrementClickCount(code, request);
      return cached;
    }

    this.logger.debug(`Cache miss for code: ${code}`);

    const urlObject = await this.incrementClickCount(code, request);

    if(!urlObject){
      this.logger.warn(`URL not found for code: ${code}`);
      throw new HttpException('URL not found', 404);
    }

    this.cacheManager.set(code, urlObject.originalUrl);

    return urlObject.originalUrl;
  }

  health() {
    return 'OK';
  }

  metrics() {
  }

}
