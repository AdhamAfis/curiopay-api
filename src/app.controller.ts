import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './modules/auth/decorators/public.decorator';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is healthy and reachable.', schema: { example: { status: 'ok', message: 'CurioPay API is healthy.', timestamp: '2024-05-01T12:00:00.000Z' } } })
  getHello(): object {
    return {
      status: 'ok',
      message: 'CurioPay API is healthy.',
      timestamp: new Date().toISOString(),
    };
  }
}
