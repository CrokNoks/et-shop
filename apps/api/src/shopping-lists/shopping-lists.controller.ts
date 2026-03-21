import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { ShoppingListsService } from './shopping-lists.service';

@Controller('shopping-lists')
export class ShoppingListsController {
  constructor(private readonly shoppingListsService: ShoppingListsService) {}

  @Get()
  async findAll() {
    return this.shoppingListsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.shoppingListsService.findOne(id);
  }

  @Post()
  async create(@Body('name') name: string, @Body('ownerId') ownerId: string) {
    return this.shoppingListsService.create(name, ownerId);
  }

  @Post(':id/items')
  async addItem(
    @Param('id') listId: string,
    @Body('name') name: string,
    @Body('categoryId') categoryId?: string,
  ) {
    return this.shoppingListsService.addItem(listId, name, categoryId);
  }

  @Patch('items/:id/toggle')
  async toggleItem(@Param('id') itemId: string, @Body('isChecked') isChecked: boolean) {
    return this.shoppingListsService.toggleItem(itemId, isChecked);
  }
}
