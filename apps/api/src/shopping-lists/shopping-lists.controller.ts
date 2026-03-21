import { Controller, Get, Post, Body, Param, Patch, Delete, Logger } from '@nestjs/common';
import { ShoppingListsService } from './shopping-lists.service';

@Controller('shopping-lists')
export class ShoppingListsController {
  private readonly logger = new Logger(ShoppingListsController.name);

  constructor(private readonly shoppingListsService: ShoppingListsService) {}

  // 1. Routes Statiques (Prioritaires)
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

  @Post('catalog')
  async createCatalogItem(@Body() payload: { name: string; barcode?: string; category_id?: string; unit?: string }) {
    return this.shoppingListsService.createCatalogItem(payload);
  }

  @Get('categories')
  async getCategories() {
    try {
      this.logger.log('Fetching all categories...');
      return await this.shoppingListsService.findAllCategories();
    } catch (error) {
      this.logger.error('Error fetching categories:', error.message);
      throw error;
    }
  }

  @Post('categories')
  async createCategory(@Body() payload: { name: string; icon?: string; sort_order?: number }) {
    return this.shoppingListsService.createCategory(payload);
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

  @Patch('catalog/:id')
  async updateCatalog(
    @Param('id') id: string,
    @Body() payload: { name?: string; barcode?: string; category_id?: string; unit?: string },
  ) {
    return this.shoppingListsService.updateCatalogItem(id, payload);
  }

  @Delete('catalog/:id')
  async deleteCatalog(@Param('id') id: string) {
    return this.shoppingListsService.deleteCatalogItem(id);
  }

  @Patch('items/:id/toggle')
  async toggleItem(@Param('id') itemId: string, @Body('isChecked') isChecked: boolean) {
    return this.shoppingListsService.toggleItem(itemId, isChecked);
  }

  @Patch('items/:id/price')
  async updatePrice(@Param('id') itemId: string, @Body('price') price: number) {
    return this.shoppingListsService.updatePrice(itemId, price);
  }

  @Patch('items/:id/quantity')
  async updateQuantity(@Param('id') itemId: string, @Body('quantity') quantity: number) {
    return this.shoppingListsService.updateQuantity(itemId, quantity);
  }

  @Patch('items/:id/unit')
  async updateUnit(@Param('id') itemId: string, @Body('unit') unit: string) {
    return this.shoppingListsService.updateUnit(itemId, unit);
  }

  @Patch('items/:id/barcode')
  async updateBarcode(@Param('id') itemId: string, @Body('barcode') barcode: string) {
    return this.shoppingListsService.updateBarcode(itemId, barcode);
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
  async update(@Param('id') id: string, @Body('name') name: string) {
    return this.shoppingListsService.update(id, name);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.shoppingListsService.remove(id);
  }

  @Post(':id/items')
  async addItem(
    @Param('id') listId: string,
    @Body() payload: { name: string; quantity?: number; barcode?: string; category_id?: string; unit?: string },
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
}
