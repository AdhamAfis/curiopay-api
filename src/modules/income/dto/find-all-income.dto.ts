import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export enum IncomeOrderBy {
  DATE_DESC = 'date_desc',
  DATE_ASC = 'date_asc',
  AMOUNT_DESC = 'amount_desc',
  AMOUNT_ASC = 'amount_asc',
  DESCRIPTION_ASC = 'description_asc',
  DESCRIPTION_DESC = 'description_desc',
}

export class FindAllIncomeDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: new Date(), description: 'Start date for filtering' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ example: new Date(), description: 'End date for filtering' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({ example: 'category-uuid', description: 'Filter by category ID' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'payment-method-uuid', description: 'Filter by payment method ID' })
  @IsUUID()
  @IsOptional()
  paymentMethodId?: string;

  @ApiPropertyOptional({ example: 'Salary', description: 'Search in income description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    enum: IncomeOrderBy,
    example: IncomeOrderBy.DATE_DESC,
    description: 'Field and direction to order results by',
  })
  @IsEnum(IncomeOrderBy)
  @IsOptional()
  orderBy?: IncomeOrderBy = IncomeOrderBy.DATE_DESC;
} 