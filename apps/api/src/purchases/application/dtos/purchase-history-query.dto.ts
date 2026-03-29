import {
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PurchaseHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by shopping list ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  listId?: string;

  @ApiPropertyOptional({
    description: 'Filter by catalog item ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  catalogItemId?: string;

  @ApiPropertyOptional({ description: 'Filter by store ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({
    description: 'Filter from date (ISO 8601)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Filter to date (ISO 8601)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class RecordPurchaseDto {
  @ApiPropertyOptional({
    description: 'Optional price override at time of purchase',
  })
  @IsOptional()
  @Type(() => Number)
  price?: number;
}
