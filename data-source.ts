import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Url } from './libs/database/src/entities/url.entity';
import { UrlClick } from './libs/database/src/entities/url_click.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [Url, UrlClick],
  migrations: ['dist/migrations/*.js'],
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
