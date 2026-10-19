import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ProductCondition,
  ProductOperationalStatus,
  UpdateProductDto,
} from '@dzencode/contracts';
import { CreateProductPriceDtoClass } from './create-product.dto';

export class UpdateProductDtoClass implements UpdateProductDto {
  @IsOptional()
  @IsNumber({}, { message: 'Серійний номер має бути числом' })
  serialNumber?: number;

  @IsOptional()
  @IsEnum(ProductCondition, { message: 'Некоректний фізичний стан продукту' })
  condition?: ProductCondition;

  @IsOptional()
  @IsEnum(ProductOperationalStatus, { message: 'Некоректний операційний статус' })
  operationalStatus?: ProductOperationalStatus;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsString({ message: 'Назва продукту повинна бути рядком' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Тип продукту повинен бути рядком' })
  type?: string;

  @IsOptional()
  @IsString({ message: 'Специфікація повинна бути рядком' })
  specification?: string;

  @IsOptional()
  guaranteeStart?: string;

  @IsOptional()
  guaranteeEnd?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductPriceDtoClass)
  prices?: CreateProductPriceDtoClass[];

  @IsOptional()
  orderId?: string;

  @IsOptional()
  groupId?: string | null;

  @IsOptional()
  assignedUserId?: string | null;
}
