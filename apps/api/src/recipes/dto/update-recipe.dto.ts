import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRecipeDto {
  @ApiProperty({ description: 'Nouveau nom de la recette', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Nouvelle description', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
