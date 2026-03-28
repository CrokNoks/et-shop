import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  NotFoundException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express'; // Import Request from express
import { SupabaseAuthGuard } from '../supabase/supabase.guard';
import { CreateLoyaltyCardDto } from './application/dtos/create-loyalty-card.dto';
import { UpdateLoyaltyCardDto } from './application/dtos/update-loyalty-card.dto';
import { CreateLoyaltyCardUseCase } from './application/create-loyalty-card.use-case';
import { GetLoyaltyCardsUseCase } from './application/get-loyalty-cards.use-case';
import { GetLoyaltyCardByIdUseCase } from './application/get-loyalty-card-by-id.use-case';
import { UpdateLoyaltyCardUseCase } from './application/update-loyalty-card.use-case';
import { DeleteLoyaltyCardUseCase } from './application/delete-loyalty-card.use-case';
import { LoyaltyCard } from './domain/loyalty-card.entity';

// Extend Request to include user property
interface AuthenticatedRequest extends Request {
  user: {
    sub: string; // Supabase user ID
    email: string;
  };
}

@ApiTags('loyalty-cards')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('loyalty-cards')
export class LoyaltyCardsController {
  constructor(
    private readonly createLoyaltyCardUseCase: CreateLoyaltyCardUseCase,
    private readonly getLoyaltyCardsUseCase: GetLoyaltyCardsUseCase,
    private readonly getLoyaltyCardByIdUseCase: GetLoyaltyCardByIdUseCase,
    private readonly updateLoyaltyCardUseCase: UpdateLoyaltyCardUseCase,
    private readonly deleteLoyaltyCardUseCase: DeleteLoyaltyCardUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new loyalty card' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The loyalty card has been successfully created.',
    type: LoyaltyCard,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async create(
    @Body() createLoyaltyCardDto: CreateLoyaltyCardDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<LoyaltyCard> {
    createLoyaltyCardDto.userId = req.user.sub; // Inject userId from authenticated user
    return this.createLoyaltyCardUseCase.execute(createLoyaltyCardDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all loyalty cards for the authenticated user' })
  @ApiQuery({
    name: 'storeIds',
    required: false,
    type: [String],
    description: 'Optional array of store IDs to filter loyalty cards.',
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of loyalty cards.',
    type: [LoyaltyCard],
  })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('storeIds') storeIds?: string | string[],
  ): Promise<LoyaltyCard[]> {
    const userId = req.user.sub;
    // Split comma-separated string if provided, otherwise pass as array
    let parsedStoreIds: string[] | undefined;
    if (storeIds) {
      if (Array.isArray(storeIds)) {
        parsedStoreIds = storeIds;
      } else if (typeof storeIds === 'string') {
        parsedStoreIds = storeIds.split(',');
      }
    }
    return this.getLoyaltyCardsUseCase.execute(userId, parsedStoreIds);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a loyalty card by ID for the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The loyalty card.',
    type: LoyaltyCard,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Loyalty card not found or access denied.',
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<LoyaltyCard> {
    try {
      return await this.getLoyaltyCardByIdUseCase.execute(id, req.user.sub);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing loyalty card' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The loyalty card has been successfully updated.',
    type: LoyaltyCard,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Loyalty card not found or access denied.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or ownership change attempted.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateLoyaltyCardDto: UpdateLoyaltyCardDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<LoyaltyCard> {
    try {
      return await this.updateLoyaltyCardUseCase.execute(
        id,
        req.user.sub,
        updateLoyaltyCardDto,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error.message === 'Cannot change ownership of a loyalty card.'
      ) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a loyalty card' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The loyalty card has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Loyalty card not found or access denied.',
  })
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    try {
      await this.deleteLoyaltyCardUseCase.execute(id, req.user.sub);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
