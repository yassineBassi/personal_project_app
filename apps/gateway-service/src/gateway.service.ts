import { Injectable } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class GatewayService {
  
  healthCheck(res: Response): void {
    res.status(200).send('OK');
  }
}
