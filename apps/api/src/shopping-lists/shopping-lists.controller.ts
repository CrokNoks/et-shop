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
    @Body('name') name: string,
  ) {
    try {
      this.logger.log(`Adding item ${name} to list ${listId}`);
      return await this.shoppingListsService.addItem(listId, name);
    } catch (error) {
      this.logger.error(`Error adding item to list ${listId}:`, error.message);
      throw error;
    }
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
}
