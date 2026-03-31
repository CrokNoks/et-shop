import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddRecipeItemDto {
  @ApiProperty({
    description: 'ID du produit dans le catalogue',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  catalog_item_id: string;

  @ApiProperty({ description: 'Quantité', minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ description: 'Unité (ex: pcs, kg, L)', required: false })
  @IsOptional()
  @IsString()
  unit?: string;
}
