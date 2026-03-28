import { PartialType } from '@nestjs/swagger';
import { CreateLoyaltyCardDto } from './create-loyalty-card.dto';
import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLoyaltyCardDto extends PartialType(CreateLoyaltyCardDto) {
  @ApiProperty({
    description:
      'ID of the user who owns the loyalty card. Should not be updated.',
    format: 'uuid',
    readOnly: true,
  })
  @IsOptional() // Make sure it's optional in PartialType
  @IsUUID()
  userId?: string; // userId should not be updatable, so mark it optional and make sure it's handled properly if sent.
}
