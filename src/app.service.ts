import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to the CurioPay API. For documentation and usage, please refer to the API docs.';
  }
}
