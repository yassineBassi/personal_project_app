import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  app.getHttpAdapter().getInstance().set('etag', false);
  app.enableCors({
    origin: process.env.ORIGIN_URLs ? process.env.ORIGIN_URLs.split(',') : '*',
    methods: 'GET,HEAD,PUT,POST,OPTIONS',
    allowedHeaders: '*',
   });
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Gateway service running on port ${port}`);
}
bootstrap();
