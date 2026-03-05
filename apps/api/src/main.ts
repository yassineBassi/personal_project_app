import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`API service running on port ${port}`);
  console.log("database name: ", process.env.DATABASE_NAME);
  console.log("database host: ", process.env.DATABASE_HOST);
  console.log("database port: ", process.env.DATABASE_PORT);
  console.log("database username: ", process.env.DATABASE_USERNAME);
  console.log("database password: ", process.env.DATABASE_PASSWORD);
}
bootstrap();
