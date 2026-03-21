import { Controller, Get, Post, Body } from '@nestjs/common';
import { HouseholdsService } from './households.service';

@Controller('households')
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
