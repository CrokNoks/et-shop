import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../supabase/supabase.guard';
import { RecordPurchaseUseCase } from './application/record-purchase.use-case';
import { CancelPurchaseUseCase } from './application/cancel-purchase.use-case';
import { GetPurchaseHistoryUseCase } from './application/get-purchase-history.use-case';
import { GetStatisticsUseCase } from './application/get-statistics.use-case';
import {
  PurchaseHistoryQueryDto,
  RecordPurchaseDto,
} from './application/dtos/purchase-history-query.dto';

@ApiTags('purchases')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(
    private readonly recordPurchaseUseCase: RecordPurchaseUseCase,
    private readonly cancelPurchaseUseCase: CancelPurchaseUseCase,
    private readonly getPurchaseHistoryUseCase: GetPurchaseHistoryUseCase,
    private readonly getStatisticsUseCase: GetStatisticsUseCase,
  ) {}

  @Get('history')
  @ApiOperation({
    summary: 'Get paginated purchase history with optional filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated purchase history',
  })
  async getHistory(@Query() query: PurchaseHistoryQueryDto) {
    return this.getPurchaseHistoryUseCase.execute(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get aggregated purchase statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Purchase statistics' })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO 8601)' })
  async getStatistics(@Query('from') from?: string, @Query('to') to?: string) {
    return this.getStatisticsUseCase.execute(from, to);
  }

  @Get('by-item/:catalogItemId')
  @ApiOperation({ summary: "Historique d'achat d'un produit spécifique" })
  @ApiParam({ name: 'catalogItemId', type: String })
  @ApiQuery({ name: 'x-household-id', required: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Purchase history for a specific catalog item',
  })
  async getByItem(@Param('catalogItemId') catalogItemId: string) {
    const result = await this.getPurchaseHistoryUseCase.execute({
      catalogItemId,
      page: 1,
      limit: 100,
    });

    const records = result.data;
    const purchaseCount = result.total;
    const lastPurchasedAt =
      records.length > 0
        ? records.reduce((latest, r) =>
            r.purchasedAt > latest.purchasedAt ? r : latest,
          ).purchasedAt
        : null;
    const avgPrice =
      records.length > 0
        ? records.reduce((sum, r) => sum + r.pricePerUnit, 0) / records.length
        : 0;

    return { records, purchaseCount, lastPurchasedAt, avgPrice };
  }

  @Post('lists/:listId/items/:itemId/purchase')
  @ApiOperation({
    summary:
      'Record a purchase (mark item as purchased and create purchase record)',
  })
  @ApiParam({ name: 'listId', description: 'Shopping list ID' })
  @ApiParam({ name: 'itemId', description: 'Shopping list item ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Purchase recorded successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Item not found in list',
  })
  async recordPurchase(
    @Param('listId') listId: string,
    @Param('itemId') itemId: string,
    @Body() dto: RecordPurchaseDto,
  ) {
    return this.recordPurchaseUseCase.execute(listId, itemId, dto.price);
  }

  @Delete('lists/:listId/items/:itemId/purchase')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Cancel a purchase (unmark item as purchased and remove purchase record)',
  })
  @ApiParam({ name: 'listId', description: 'Shopping list ID' })
  @ApiParam({ name: 'itemId', description: 'Shopping list item ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Purchase cancelled successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Item not found in list',
  })
  async cancelPurchase(
    @Param('listId') listId: string,
    @Param('itemId') itemId: string,
  ): Promise<void> {
    return this.cancelPurchaseUseCase.execute(listId, itemId);
  }
}
