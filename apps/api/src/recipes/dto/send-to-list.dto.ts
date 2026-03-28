import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendToListDto {
  @ApiProperty({ description: 'ID de la liste de courses cible', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  shopping_list_id: string;
}
