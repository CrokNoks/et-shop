import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
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

  @ApiProperty({
    description: 'Nombre de couverts (par défaut 4)',
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  servings?: number;
}
