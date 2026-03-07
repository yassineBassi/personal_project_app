import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';

@Module({
  imports: [HttpModule],
  providers: [GatewayService],
  controllers: [GatewayController],
})
export class GatewayModule {}
