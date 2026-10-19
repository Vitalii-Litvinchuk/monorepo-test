import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CurrencyCode,
  PriceCurrencyRole,
  ProductCondition,
  ProductOperationalStatus,
  CreateProductDto,
  CreateProductPriceDto,
} from '@dzencode/contracts';

export class CreateProductPriceDtoClass implements CreateProductPriceDto {
  @IsNumber({}, { message: 'Значення ціни має бути числом' })
  value: number;

  @IsEnum(CurrencyCode, { message: 'Непідтримувана валюта' })
  currencyCode: CurrencyCode;

  @IsEnum(PriceCurrencyRole, { message: 'Непідтримувана роль ціни' })
  currencyRole: PriceCurrencyRole;
}

export class CreateProductDtoClass implements CreateProductDto {
  @IsNumber({}, { message: 'Серійний номер має бути числом' })
  serialNumber: number;

  @IsEnum(ProductCondition, { message: 'Некоректний фізичний стан продукту' })
  condition: ProductCondition;

  @IsOptional()
  @IsEnum(ProductOperationalStatus, { message: 'Некоректний операційний статус' })
  operationalStatus?: ProductOperationalStatus;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsNotEmpty({ message: 'Назва продукту є обов’язковою' })
  @IsString({ message: 'Назва продукту повинна бути рядком' })
  title: string;

  @IsNotEmpty({ message: 'Тип продукту є обов’язковим' })
  @IsString({ message: 'Тип продукту повинен бути рядком' })
  type: string;

  @IsNotEmpty({ message: 'Специфікація є обов’язковою' })
  @IsString({ message: 'Специфікація повинна бути рядком' })
  specification: string;

  @IsNotEmpty({ message: 'Дата початку гарантії є обов’язковою' })
  guaranteeStart: string;

  @IsNotEmpty({ message: 'Дата закінчення гарантії є обов’язковою' })
  guaranteeEnd: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductPriceDtoClass)
  prices: CreateProductPriceDtoClass[];

  @IsNotEmpty({ message: 'ID приходу є обов’язковим' })
  orderId: string;

  @IsOptional()
  groupId?: string | null;

  @IsOptional()
  assignedUserId?: string | null;
}
