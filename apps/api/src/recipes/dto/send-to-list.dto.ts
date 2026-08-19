import { IsArray, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendToListDto {
  @ApiProperty({
    description: 'ID de la liste de courses cible',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  shopping_list_id: string;

  @ApiProperty({
    description:
      'IDs des recipe_items (ingrédients) à envoyer. Si absent ou vide, tous les ingrédients de la recette sont envoyés.',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  item_ids?: string[];
}
