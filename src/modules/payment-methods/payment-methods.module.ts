import { Module } from '@nestjs/common';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentMethodsService } from './payment-methods.service';
import { PaymentMethodsRepository } from './payment-methods.repository';
import { PaymentMethodsSeeder } from './seeds/payment-methods.seeder';

@Module({
  controllers: [PaymentMethodsController],
  providers: [PaymentMethodsService, PaymentMethodsRepository, PaymentMethodsSeeder],
  exports: [PaymentMethodsService, PaymentMethodsRepository, PaymentMethodsSeeder],
})
export class PaymentMethodsModule {} 