import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { CreateGroupDto } from '@dzencode/contracts';

export class CreateGroupDtoClass implements CreateGroupDto {
  @IsNotEmpty({ message: 'Назва групи обовʼязкова' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;
}
