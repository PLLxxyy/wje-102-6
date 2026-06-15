import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { OperationAction } from '../../types/enums';
import { OperationLogService } from '../operation-log/operation-log.service';
import { AddRecipeDto } from './dto/add-recipe.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { Collection } from './collection.entity';
import { CollectionService } from './collection.service';

@Controller('collections')
export class CollectionController {
  constructor(
    private readonly collectionService: CollectionService,
    private readonly operationLogService: OperationLogService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: JwtUser): Promise<Collection[]> {
    return this.collectionService.findMine(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateCollectionDto): Promise<Collection> {
    return this.collectionService.create(user.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateCollectionDto,
  ): Promise<Collection> {
    return this.collectionService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser): Promise<{ deleted: true }> {
    return this.collectionService.remove(id, user.id);
  }

  @Post(':id/recipes')
  @UseGuards(JwtAuthGuard)
  addRecipe(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
    @Body() dto: AddRecipeDto,
  ): Promise<Collection> {
    return this.collectionService.addRecipe(id, user.id, dto.recipeId);
  }

  @Delete(':id/recipes/:recipeId')
  @UseGuards(JwtAuthGuard)
  removeRecipe(
    @Param('id', ParseIntPipe) id: number,
    @Param('recipeId', ParseIntPipe) recipeId: number,
    @CurrentUser() user: JwtUser,
  ): Promise<Collection> {
    return this.collectionService.removeRecipe(id, user.id, recipeId);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  async share(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
    @Req() req: RequestWithUser,
  ): Promise<Collection> {
    const collection = await this.collectionService.share(id, user.id);
    void this.operationLogService.record({
      user_id: user.id,
      action: OperationAction.Share,
      resource: 'collections',
      resource_id: id,
      detail: JSON.stringify({ share_token: collection.share_token }),
      ip: req.ip ?? '',
    });
    return collection;
  }

  @Post(':id/unshare')
  @UseGuards(JwtAuthGuard)
  async unshare(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
    @Req() req: RequestWithUser,
  ): Promise<Collection> {
    const collection = await this.collectionService.unshare(id, user.id);
    void this.operationLogService.record({
      user_id: user.id,
      action: OperationAction.Unshare,
      resource: 'collections',
      resource_id: id,
      detail: null,
      ip: req.ip ?? '',
    });
    return collection;
  }

  @Get('shared/:token')
  findShared(@Param('token') token: string): Promise<Collection> {
    return this.collectionService.findByShareToken(token);
  }
}
