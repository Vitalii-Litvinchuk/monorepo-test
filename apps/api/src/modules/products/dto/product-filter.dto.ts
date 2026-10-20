import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  ProductCondition,
  ProductFilterQuery,
  ProductOperationalStatus,
} from '@dzencode/contracts';

const sanitizeFilterValue = (val: any) => {
  if (typeof val === 'string') {
    const clean = val.trim();
    if (clean === '' || clean.toLowerCase() === 'all') return undefined;
    return clean;
  }
  return val;
};

export class ProductFilterDtoClass implements ProductFilterQuery {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeFilterValue(value))
  type?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeFilterValue(value))
  specification?: string;

  @IsOptional()
  @IsEnum(ProductCondition)
  condition?: ProductCondition;

  @IsOptional()
  @IsEnum(ProductOperationalStatus)
  operationalStatus?: ProductOperationalStatus;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeFilterValue(value))
  orderId?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;
}
