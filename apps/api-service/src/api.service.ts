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
import { UAParser } from 'ua-parser-js';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Counter } from 'prom-client';

@Injectable()
export class ApiService {

  private readonly logger = new Logger(ApiService.name);
  private sqsClient: SQSClient;

  constructor(
    @InjectRepository(Url) private urlsRepository: Repository<Url>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject() private readonly configService: ConfigService,
    @InjectMetric('api_urls_shortened_total') private readonly urlsShortenedCounter: Counter<string>,
    @InjectMetric('api_url_resolves_total') private readonly urlResolvesCounter: Counter<string>,
    @InjectMetric('api_url_not_found_total') private readonly urlNotFoundCounter: Counter<string>,
    @InjectMetric('api_cache_lookups_total') private readonly cacheLookupCounter: Counter<string>,
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
    this.urlsShortenedCounter.inc();

    return {
      code: urlObject.code
    };
  }

  async incrementClickCount(code: string, request: Request): Promise<Url | null> {
    const url = this.configService.get('CLICKS_QUEUE_URL');

    const clientIp = request.headers['x-forwarded-for'];
    
    const userAgent = request.headers['user-agent'];
    const clientBrowser = new UAParser(userAgent).getBrowser().name;
    const clientDeviceType = new UAParser(userAgent).getDevice().type || 'desktop';
    const clientOS = new UAParser(userAgent).getOS().name;

    const urlObject = await this.urlsRepository.findOne({where: {code}});
    if(urlObject){
      const command = new SendMessageCommand({
        QueueUrl: url,
        MessageBody: JSON.stringify({
          urlId: urlObject.id,
          clientIp,
          clientBrowser,
          clientDeviceType,
          clientOS,
          timestamp: new Date()
        })
      });
      const response = await this.sqsClient.send(command);
    }

    return urlObject;
  }

  async getOriginalURL(code: string, request: Request) {
    this.logger.log(`Resolving URL for code: ${code}`);

    this.urlResolvesCounter.inc();

    let cached: string | undefined;
    try {
      cached = await this.cacheManager.get<string>(code);
    } catch (err) {
      this.logger.warn(`Cache lookup failed for code ${code}: ${err}`);
    }

    if (cached) {
      this.logger.debug(`Cache hit for code: ${code}`);
      this.cacheLookupCounter.inc({ result: 'hit' });
      this.incrementClickCount(code, request);
      return cached;
    }

    this.cacheLookupCounter.inc({ result: 'miss' });
    this.logger.debug(`Cache miss for code: ${code}`);

    let urlObject: Url | null;
    try {
      urlObject = await this.incrementClickCount(code, request);
    } catch (err) {
      this.logger.error(`Failed to resolve URL for code ${code}: ${err?.message}`, err?.stack);
      throw new HttpException('Failed to resolve URL', 500);
    }

    if (!urlObject) {
      this.logger.warn(`URL not found for code: ${code}`);
      this.urlNotFoundCounter.inc();
      throw new HttpException('URL not found', 404);
    }

    try {
      await this.cacheManager.set(code, urlObject.originalUrl);
    } catch (err) {
      this.logger.warn(`Cache set failed for code ${code}: ${err?.message}`);
    }

    const url = urlObject.originalUrl;
    this.logger.log(`Original URL for code ${code} is ${url}`);
    return url;
  }

  health() {
    return 'OK';
  }

}
