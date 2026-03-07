import { Url } from '@app/database';
import { Get, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as UUID } from 'uuid';

@Injectable()
export class ApiService {

  constructor(@InjectRepository(Url) private urlsRepository: Repository<Url>){}

    async shortenURL(url: string) {
      console.log("shorten url api");
      
      const urlObject = {
        originalUrl: url,
        code: UUID(),
        clickCount: 0
      };
      console.log("url object", urlObject);
      
      await this.urlsRepository.save(urlObject);
      console.log("saved");
      
      return "done";
    }
  
    async getOriginalURL(code: string) {
      console.log("get original url");
      console.log("code is ", code);

      const urlObject = await this.urlsRepository.findOne({where: {code}});
      console.log("url object is ", urlObject);

      if(!urlObject){
        throw new HttpException('URL not found', 404);
      }

      urlObject.clickCount += 1;
      this.urlsRepository.save(urlObject);
      console.log("url object click count", urlObject.clickCount)

      return urlObject.originalUrl;
    }
  
    health() {
      return 'OK';
    }
  
    metrics() {
    }

}
