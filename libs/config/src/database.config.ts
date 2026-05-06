import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST'),
  port: configService.get<number>('DATABASE_PORT', 5432),
  username: configService.get<string>('DATABASE_USERNAME'),
  password: configService.get<string>('DATABASE_PASSWORD'),
  database: configService.get<string>('DATABASE_NAME'),
  autoLoadEntities: true,
  synchronize: configService.get<string>('ENV') === 'dev',
  migrations: ['dist/migrations/*.js'],
  migrationsRun: configService.get<string>('ENV') !== 'dev' && configService.get<string>('RUN_MIGRATIONS') === 'true',
  ssl: {
    rejectUnauthorized: false,
  },
});
