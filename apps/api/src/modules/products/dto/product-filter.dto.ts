import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  ProductCondition,
  ProductFilterQuery,
  ProductOperationalStatus,
} from '@dzencode/contracts';

export class ProductFilterDtoClass implements ProductFilterQuery {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsOptional()
  @IsEnum(ProductCondition)
  condition?: ProductCondition;

  @IsOptional()
  @IsEnum(ProductOperationalStatus)
  operationalStatus?: ProductOperationalStatus;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
