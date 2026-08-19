import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HouseholdsService } from './households.service';
import { SupabaseAuthGuard } from '../supabase/supabase.guard';
import { JoinHouseholdDto } from './dto/join-household.dto';

@ApiTags('households')
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

  @Get(':id/members')
  async findMembers(@Param('id') id: string) {
    return this.householdsService.findMembers(id);
  }

  @Post(':id/members')
  async addMember(@Param('id') id: string, @Body('email') email: string) {
    return this.householdsService.addMember(id, email);
  }

  @Delete(':id/members/:userId')
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.householdsService.removeMember(id, userId);
  }

  @Post(':id/invite-code')
  @ApiOperation({
    summary: "Générer un code d'invitation (valable 48h, usage unique)",
  })
  async createInviteCode(@Param('id') id: string) {
    return this.householdsService.createInviteCode(id);
  }

  @Post('join')
  @ApiOperation({ summary: "Rejoindre un foyer via un code d'invitation" })
  async join(@Body() dto: JoinHouseholdDto) {
    return this.householdsService.joinHousehold(dto.code);
  }
}
