import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BarcodeFormat } from '../../domain/barcode-format.enum';

export class CreateLoyaltyCardDto {
  @ApiProperty({
    description:
      'ID of the user who owns the loyalty card. Auto-filled by the system.',
    format: 'uuid',
    readOnly: true, // Mark as read-only for Swagger documentation
  })
  @IsUUID()
  userId: string; // Will be taken from auth.uid()

  @ApiProperty({
    description: 'ID of the store associated with the loyalty card.',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  storeId: string;

  @ApiProperty({ description: 'Display name for the loyalty card.' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Optional description.', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'The actual data of the loyalty card (e.g., card number).',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  cardData: string;

  @ApiProperty({
    description: 'Format of the barcode (e.g., CODE_128, QR_CODE, EAN_13).',
    enum: BarcodeFormat,
  })
  @IsEnum(BarcodeFormat)
  @IsNotEmpty()
  barcodeFormat: BarcodeFormat;

  @ApiProperty({
    description:
      'Optional custom color for the card in hex format (e.g., #RRGGBB).',
    required: false,
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsString()
  @Length(7, 7) // #RRGGBB format
  customColor?: string;
}
