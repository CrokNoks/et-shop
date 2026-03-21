import { Controller, Get, Post, Body, Param, Patch, Logger } from '@nestjs/common';
import { ShoppingListsService } from './shopping-lists.service';

@Controller('shopping-lists')
export class ShoppingListsController {
  private readonly logger = new Logger(ShoppingListsController.name);

  constructor(private readonly shoppingListsService: ShoppingListsService) {}

  @Get()
  async findAll() {
    try {
      this.logger.log('Fetching all shopping lists...');
      return await this.shoppingListsService.findAll();
    } catch (error) {
      this.logger.error('Error fetching shopping lists:', error.message);
      throw error;
    }
  }

  @Get('catalog')
  async getCatalog() {
    try {
      this.logger.log('Fetching all products from catalog...');
      return await this.shoppingListsService.findAllCatalog();
    } catch (error) {
      this.logger.error('Error fetching catalog:', error.message);
      throw error;
    }
  }

  @Patch('catalog/:id')
  async updateCatalog(
    @Param('id') id: string,
    @Body() payload: { name?: string; barcode?: string; category_id?: string },
  ) {
    return this.shoppingListsService.updateCatalogItem(id, payload);
  }

  @Delete('catalog/:id')
  async deleteCatalog(@Param('id') id: string) {
    return this.shoppingListsService.deleteCatalogItem(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`Fetching shopping list items for list: ${id}`);
      return await this.shoppingListsService.findOne(id);
    } catch (error) {
      this.logger.error(`Error fetching shopping list items for list ${id}:`, error.message);
      throw error;
    }
  }

  @Get('suggest/:query')
  async suggest(@Param('query') query: string) {
    try {
      return await this.shoppingListsService.suggestItems(query);
    } catch (error) {
      this.logger.error(`Error suggesting items for query ${query}:`, error.message);
      throw error;
    }
  }

  @Post()
  async create(@Body('name') name: string) {
    return this.shoppingListsService.create(name);
  }

  @Post(':id/items')
  async addItem(
    @Param('id') listId: string,
    @Body() payload: { name: string; quantity?: number; barcode?: string },
  ) {
    try {
      this.logger.log(`Adding item ${payload.name} to list ${listId}`);
      return await this.shoppingListsService.addItem(listId, payload);
    } catch (error) {
      this.logger.error(`Error adding item to list ${listId}:`, error.message);
      throw error;
    }
  }

  @Post(':id/barcode')
  async addItemByBarcode(
    @Param('id') listId: string,
    @Body('barcode') barcode: string,
  ) {
    return this.shoppingListsService.addItemByBarcode(listId, barcode);
  }

  @Patch('items/:id/toggle')
  async toggleItem(@Param('id') itemId: string, @Body('isChecked') isChecked: boolean) {
    try {
      return await this.shoppingListsService.toggleItem(itemId, isChecked);
    } catch (error) {
      this.logger.error(`Error toggling item ${itemId}:`, error.message);
      throw error;
    }
  }

  @Patch('items/:id/price')
  async updatePrice(@Param('id') itemId: string, @Body('price') price: number) {
    try {
      this.logger.log(`Updating price for item ${itemId} to ${price}`);
      return await this.shoppingListsService.updatePrice(itemId, price);
    } catch (error) {
      this.logger.error(`Error updating price for item ${itemId}:`, error.message);
      throw error;
    }
  }

  @Patch('items/:id/quantity')
  async updateQuantity(@Param('id') itemId: string, @Body('quantity') quantity: number) {
    try {
      this.logger.log(`Updating quantity for item ${itemId} to ${quantity}`);
      return await this.shoppingListsService.updateQuantity(itemId, quantity);
    } catch (error) {
      this.logger.error(`Error updating quantity for item ${itemId}:`, error.message);
      throw error;
    }
  }

  @Patch('items/:id/barcode')
  async updateBarcode(@Param('id') itemId: string, @Body('barcode') barcode: string) {
    return this.shoppingListsService.updateBarcode(itemId, barcode);
  }
}
