import { Url } from '@app/database';
import { UrlClick } from '@app/database/entities/url_click.entity';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AnalyticsService {

  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Url) private readonly urlRepository: Repository<Url>,
    @InjectRepository(UrlClick) private readonly urlClickRepository: Repository<UrlClick>,
  ) {}

  async getClickAnalytics(code: string) {
    this.logger.log('---------------------------------------');
    this.logger.log('Get click analytics for url code : ' + code);

    const urlObject = await this.urlRepository.findOne({where: {code}, relations: ['clicks']});
    this.logger.log('Url object : ', urlObject);
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

  async dashboard() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalClicks,
      totalUrls,
      uniqueVisitorsRaw,
      clicksLast24h,
      clicksPrev24h,
      topUrls,
      trend,
      browserBreakdown,
      peakHoursRaw,
    ] = await Promise.all([
      this.urlClickRepository.count(),

      this.urlRepository.count(),

      this.urlClickRepository
        .createQueryBuilder('click')
        .select('COUNT(DISTINCT click.clientIp)', 'count')
        .getRawOne(),

      this.urlClickRepository
        .createQueryBuilder('click')
        .where('click.time >= :from', { from: oneDayAgo })
        .getCount(),

      this.urlClickRepository
        .createQueryBuilder('click')
        .where('click.time >= :from AND click.time < :to', { from: twoDaysAgo, to: oneDayAgo })
        .getCount(),

      this.urlRepository
        .createQueryBuilder('url')
        .leftJoin('url.clicks', 'click')
        .select(['url.code AS code', 'url.originalUrl AS "originalUrl"', 'url.createdAt AS "createdAt"'])
        .addSelect('COUNT(click.id)', 'clickCount')
        .groupBy('url.id')
        .orderBy('"clickCount"', 'DESC')
        .limit(10)
        .getRawMany(),

      this.urlClickRepository
        .createQueryBuilder('click')
        .select("DATE_TRUNC('day', click.time)", 'date')
        .addSelect('COUNT(*)', 'clicks')
        .where('click.time >= :from', { from: thirtyDaysAgo })
        .groupBy('date')
        .orderBy('date', 'ASC')
        .getRawMany(),

      this.urlClickRepository
        .createQueryBuilder('click')
        .select('click.clientBrowser', 'browser')
        .addSelect('COUNT(*)', 'count')
        .groupBy('click.clientBrowser')
        .orderBy('count', 'DESC')
        .getRawMany(),

      this.urlClickRepository
        .createQueryBuilder('click')
        .select('EXTRACT(HOUR FROM click.time)', 'hour')
        .addSelect('COUNT(*)', 'count')
        .groupBy('hour')
        .orderBy('count', 'DESC')
        .getRawMany(),
    ]);

    const uniqueVisitors = parseInt(uniqueVisitorsRaw?.count ?? '0');
    const growthRate = clicksPrev24h === 0 && clicksLast24h === 0
      ? null
      : clicksPrev24h === 0
        ? 100
        : Number(((clicksLast24h - clicksPrev24h) / clicksPrev24h * 100).toFixed(1));

    return {
      summary: {
        totalClicks,
        totalUrls,
        uniqueVisitors,
        avgClicksPerUrl: totalUrls > 0 ? Number((totalClicks / totalUrls).toFixed(1)) : 0,
      },
      activity: {
        clicksLast24h,
        clicksPrev24h,
        growthRate,
      },
      topUrls: topUrls.map(row => ({
        code: row.code,
        originalUrl: row.originalUrl,
        createdAt: row.createdAt,
        clickCount: parseInt(row.clickCount),
      })),
      trend: trend.map(row => ({
        date: row.date,
        clicks: parseInt(row.clicks),
      })),
      browsers: browserBreakdown.map(row => ({
        browser: row.browser || 'Unknown',
        count: parseInt(row.count),
      })),
      peakHours: peakHoursRaw.map(row => ({
        hour: parseInt(row.hour),
        count: parseInt(row.count),
      })),
    };
  }
    
}
