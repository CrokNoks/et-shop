import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { SupabaseAuthGuard } from '../supabase/supabase.guard';

@Controller('stores')
@UseGuards(SupabaseAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  async findAll(@Headers('x-household-id') householdId: string) {
    if (!householdId) {
      throw new BadRequestException('x-household-id header is required');
    }
    return this.storesService.findAll(householdId);
  }

  @Post()
  async create(
    @Headers('x-household-id') householdId: string,
    @Body('name') name: string,
  ) {
    if (!householdId) {
      throw new BadRequestException('x-household-id header is required');
    }
    return this.storesService.create({ name, householdId });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body('name') name: string) {
    return this.storesService.update(id, name);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.storesService.remove(id);
  }

  @Get(':id/categories')
  async getCategories(@Param('id') id: string) {
    return this.storesService.getCategories(id);
  }

  @Put(':id/categories')
  async updateCategoryOrders(
    @Param('id') id: string,
    @Body('orders') orders: { categoryId: string; sortOrder: number }[],
  ) {
    return this.storesService.updateCategoryOrders(id, orders);
  }
}
