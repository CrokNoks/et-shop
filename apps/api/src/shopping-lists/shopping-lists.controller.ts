import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Logger,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ShoppingListsService } from './shopping-lists.service';
import { SupabaseAuthGuard } from '../supabase/supabase.guard';
import { RecordPurchaseUseCase } from '../purchases/application/record-purchase.use-case';
import { CancelPurchaseUseCase } from '../purchases/application/cancel-purchase.use-case';

@ApiTags('shopping-lists')
@ApiBearerAuth()
@Controller('shopping-lists')
@UseGuards(SupabaseAuthGuard)
export class ShoppingListsController {
  private readonly logger = new Logger(ShoppingListsController.name);

  constructor(
    private readonly shoppingListsService: ShoppingListsService,
    private readonly recordPurchaseUseCase: RecordPurchaseUseCase,
    private readonly cancelPurchaseUseCase: CancelPurchaseUseCase,
  ) {}

  // 1. Routes Statiques (Prioritaires)
  @Get('catalog')
  async getCatalog(@Query('storeId') storeId?: string) {
    try {
      this.logger.log(
        `Fetching all products from catalog for store: ${storeId || 'all'}...`,
      );
      return await this.shoppingListsService.findAllCatalog(storeId);
    } catch (error) {
      this.logger.error('Error fetching catalog:', error.message);
      throw error;
    }
  }

  @Post('catalog')
  async createCatalogItem(
    @Body()
    payload: {
      name: string;
      barcode?: string;
      category_id?: string;
      unit?: string;
      store_id: string;
    },
  ) {
    return this.shoppingListsService.createCatalogItem(payload);
  }

  @Post('catalog/import')
  async importCatalog(
    @Body('items')
    items: {
      name: string;
      barcode?: string;
      unit?: string;
      category_name?: string;
    }[],
    @Body('store_id') storeId: string,
  ) {
    return this.shoppingListsService.importCatalogItems(items, storeId);
  }

  @Get('categories')
  async getCategories(@Query('storeId') storeId?: string) {
    try {
      this.logger.log(
        `Fetching all categories for store: ${storeId || 'all'}...`,
      );
      return await this.shoppingListsService.findAllCategories(storeId);
    } catch (error) {
      this.logger.error('Error fetching categories:', error.message);
      throw error;
    }
  }

  @Post('categories')
  async createCategory(
    @Body()
    payload: {
      name: string;
      icon?: string;
      sort_order?: number;
      store_id: string;
    },
  ) {
    return this.shoppingListsService.createCategory(payload);
  }

  @Post('categories/import')
  async importCategories(
    @Body('categories')
    categories: { name: string; icon?: string; sort_order?: number }[],
    @Body('store_id') storeId: string,
  ) {
    return this.shoppingListsService.importCategories(categories, storeId);
  }

  // 2. Routes de Ressources Globales (Patches/Deletes)
  @Patch('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() payload: { name?: string; icon?: string; sort_order?: number },
  ) {
    return this.shoppingListsService.updateCategory(id, payload);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.shoppingListsService.deleteCategory(id);
  }

  @Patch('catalog/bulk-category')
  async bulkUpdateCatalogCategory(
    @Body() payload: { ids: string[]; category_id: string },
  ) {
    return this.shoppingListsService.bulkUpdateCatalogItemsCategory(
      payload.ids,
      payload.category_id,
    );
  }

  @Patch('catalog/:id')
  async updateCatalog(
    @Param('id') id: string,
    @Body()
    payload: {
      name?: string;
      barcode?: string;
      category_id?: string;
      unit?: string;
    },
  ) {
    return this.shoppingListsService.updateCatalogItem(id, payload);
  }

  @Delete('catalog/:id')
  async deleteCatalogItem(@Param('id') id: string) {
    return this.shoppingListsService.deleteCatalogItem(id);
  }

  @Patch('items/:id/toggle')
  async toggleItem(
    @Param('id') itemId: string,
    @Body('isChecked') isChecked: boolean,
  ) {
    return this.shoppingListsService.toggleItem(itemId, isChecked);
  }

  @Patch('items/:id/price')
  async updatePrice(@Param('id') itemId: string, @Body('price') price: number) {
    return this.shoppingListsService.updatePrice(itemId, price);
  }

  @Patch('items/:id/quantity')
  async updateQuantity(
    @Param('id') itemId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.shoppingListsService.updateQuantity(itemId, quantity);
  }

  @Patch('items/:id/unit')
  async updateUnit(@Param('id') itemId: string, @Body('unit') unit: string) {
    return this.shoppingListsService.updateUnit(itemId, unit);
  }

  @Patch('items/:id/barcode')
  async updateBarcode(
    @Param('id') itemId: string,
    @Body('barcode') barcode: string,
  ) {
    return this.shoppingListsService.updateBarcode(itemId, barcode);
  }

  @Delete('items/:id')
  async removeItem(@Param('id') itemId: string) {
    return this.shoppingListsService.removeItem(itemId);
  }

  @Get('suggest/:query')
  async suggest(@Param('query') query: string) {
    return this.shoppingListsService.suggestItems(query);
  }

  // 3. Routes de Collection (Shopping Lists)
  @Get()
  async findAll() {
    return this.shoppingListsService.findAll();
  }

  @Post()
  async create(@Body('name') name: string) {
    return this.shoppingListsService.create(name);
  }

  // 4. Routes d'Instance Unique (toujours à la fin)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.shoppingListsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body('name') name?: string,
    @Body('store_id') store_id?: string | null,
  ) {
    return this.shoppingListsService.update(id, { name, store_id });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.shoppingListsService.remove(id);
  }

  @Post(':id/items')
  async addItem(
    @Param('id') listId: string,
    @Body()
    payload: {
      name: string;
      quantity?: number;
      barcode?: string;
      category_id?: string;
      unit?: string;
      store_id?: string;
      catalog_item_id?: string;
    },
  ) {
    return this.shoppingListsService.addItem(listId, payload);
  }

  @Post(':id/barcode')
  async addItemByBarcode(
    @Param('id') listId: string,
    @Body('barcode') barcode: string,
  ) {
    return this.shoppingListsService.addItemByBarcode(listId, barcode);
  }

  @Patch(':listId/items/:itemId/purchase')
  @ApiOperation({
    summary: 'Mark item as purchased and record the purchase (atomic)',
  })
  @ApiParam({ name: 'listId', description: 'Shopping list ID' })
  @ApiParam({ name: 'itemId', description: 'Shopping list item ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Purchase recorded successfully',
  })
  async purchaseItem(
    @Param('listId') listId: string,
    @Param('itemId') itemId: string,
    @Body('price') price?: number,
  ) {
    return this.recordPurchaseUseCase.execute(listId, itemId, price);
  }

  @Patch(':listId/items/:itemId/unpurchase')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancel a purchase and unmark item as purchased (atomic)',
  })
  @ApiParam({ name: 'listId', description: 'Shopping list ID' })
  @ApiParam({ name: 'itemId', description: 'Shopping list item ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Purchase cancelled successfully',
  })
  async unpurchaseItem(
    @Param('listId') listId: string,
    @Param('itemId') itemId: string,
  ): Promise<void> {
    return this.cancelPurchaseUseCase.execute(listId, itemId);
  }
}
