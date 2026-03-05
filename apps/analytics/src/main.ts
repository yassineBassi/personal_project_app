import { NestFactory } from '@nestjs/core';
import { AnalyticsModule } from './analytics.module';

async function bootstrap() {
  const app = await NestFactory.create(AnalyticsModule);
  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`Analytics service running on port ${port}`);
  console.log(`API service running on port ${port}`);
  console.log("database name: ", process.env.DATABASE_NAME);
  console.log("database host: ", process.env.DATABASE_HOST);
  console.log("database port: ", process.env.DATABASE_PORT);
  console.log("database username: ", process.env.DATABASE_USERNAME);
  console.log("database password: ", process.env.DATABASE_PASSWORD);
}
bootstrap();
