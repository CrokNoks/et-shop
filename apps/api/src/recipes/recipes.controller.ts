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
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { SupabaseAuthGuard } from '../supabase/supabase.guard';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { AddRecipeItemDto } from './dto/add-recipe-item.dto';
import { SendToListDto } from './dto/send-to-list.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('recipes')
@Controller('recipes')
@UseGuards(SupabaseAuthGuard)
export class RecipesController {
  private readonly logger = new Logger(RecipesController.name);

  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister toutes les recettes du ménage' })
  async findAll() {
    return this.recipesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Créer une recette' })
  async create(@Body() dto: CreateRecipeDto) {
    return this.recipesService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une recette avec ses items" })
  async findOne(@Param('id') id: string) {
    return this.recipesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Modifier le nom/description d'une recette" })
  async update(@Param('id') id: string, @Body() dto: UpdateRecipeDto) {
    return this.recipesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une recette' })
  async remove(@Param('id') id: string) {
    return this.recipesService.remove(id);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Ajouter un produit à la recette' })
  async addItem(@Param('id') recipeId: string, @Body() dto: AddRecipeItemDto) {
    return this.recipesService.addItem(recipeId, dto);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: "Modifier quantité/unité d'un item" })
  async updateItem(
    @Param('id') recipeId: string,
    @Param('itemId') itemId: string,
    @Body() payload: { quantity?: number; unit?: string },
  ) {
    return this.recipesService.updateItem(recipeId, itemId, payload);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Retirer un produit de la recette' })
  async removeItem(
    @Param('id') recipeId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.recipesService.removeItem(recipeId, itemId);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Envoyer la recette vers une liste de courses' })
  async sendToList(@Param('id') recipeId: string, @Body() dto: SendToListDto) {
    return this.recipesService.sendToList(recipeId, dto.shopping_list_id);
  }
}
