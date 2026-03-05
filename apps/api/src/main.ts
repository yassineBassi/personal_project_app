import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);
  const port = process.env.PORT || 3001;
  await app.listen(port);
}
bootstrap();
