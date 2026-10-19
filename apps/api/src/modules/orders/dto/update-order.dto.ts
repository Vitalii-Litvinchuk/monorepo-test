import { IsOptional, IsString, Length, IsNumber } from 'class-validator';
import { UpdateOrderDto } from '@dzencode/contracts';

export class UpdateOrderDtoClass implements UpdateOrderDto {
  @IsOptional()
  @IsString({ message: 'Назва приходу повинна бути рядком' })
  @Length(3, 150, { message: 'Назва приходу повинна містити від 3 до 150 символів' })
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Широта має бути числом' })
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Довгота має бути числом' })
  longitude?: number;
}
