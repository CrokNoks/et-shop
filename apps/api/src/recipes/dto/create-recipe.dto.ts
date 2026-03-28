import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRecipeDto {
  @ApiProperty({ description: 'Nom de la recette' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description optionnelle', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
