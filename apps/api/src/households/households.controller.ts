import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { HouseholdsService } from './households.service';
import { SupabaseAuthGuard } from '../supabase/supabase.guard';

@Controller('households')
@UseGuards(SupabaseAuthGuard)
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Get('me')
  async findMyHouseholds() {
    return this.householdsService.findMyHouseholds();
  }

  @Post()
  async create(@Body('name') name: string) {
    return this.householdsService.create(name);
  }
}
