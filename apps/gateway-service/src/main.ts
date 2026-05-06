import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  const origin_urls = process.env.ORIGIN_URLS ? process.env.ORIGIN_URLS.split(',').map(o => o.trim().replace(/\/$/, '')) : [];
  console.log("Allowed Origin URLs: ", origin_urls);
  app.getHttpAdapter().getInstance().set('etag', false);
  app.enableCors({
    origin: origin_urls,
    methods: 'GET,HEAD,PUT,POST,OPTIONS',
    allowedHeaders: '*',
   });
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Gateway service running on port ${port}`);
}
bootstrap();
