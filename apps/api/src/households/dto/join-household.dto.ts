import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinHouseholdDto {
  @ApiProperty({ description: "Code d'invitation (8 caractères)" })
  @IsString()
  @IsNotEmpty()
  @Length(6, 12)
  code: string;
}
