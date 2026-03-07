import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Gateway service running on port ${port}`);
}
bootstrap();
