import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { UpdateGroupDto } from '@dzencode/contracts';

export class UpdateGroupDtoClass implements UpdateGroupDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;
}
