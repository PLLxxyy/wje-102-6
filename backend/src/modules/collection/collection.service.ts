import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Recipe } from '../recipe/recipe.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { Collection } from './collection.entity';

@Injectable()
export class CollectionService {
  constructor(
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
  ) {}

  findMine(userId: number): Promise<Collection[]> {
    return this.collectionRepository.find({
      where: { user_id: userId },
      relations: { recipes: { author: true } },
      order: { updated_at: 'DESC' },
    });
  }

  async create(userId: number, dto: CreateCollectionDto): Promise<Collection> {
    const collection = this.collectionRepository.create({
      user_id: userId,
      name: dto.name,
      description: dto.description ?? null,
      is_public: dto.is_public ?? false,
      share_token: null,
      shared_at: null,
      recipes: [],
    });
    return this.collectionRepository.save(collection);
  }

  async update(id: number, userId: number, dto: UpdateCollectionDto): Promise<Collection> {
    const collection = await this.findOwned(id, userId);
    if (dto.name !== undefined) collection.name = dto.name;
    if (dto.description !== undefined) collection.description = dto.description ?? null;
    if (dto.is_public !== undefined) collection.is_public = dto.is_public;
    return this.collectionRepository.save(collection);
  }

  async remove(id: number, userId: number): Promise<{ deleted: true }> {
    const collection = await this.findOwned(id, userId);
    await this.collectionRepository.remove(collection);
    return { deleted: true };
  }

  async addRecipe(id: number, userId: number, recipeId: number): Promise<Collection> {
    const collection = await this.findOwned(id, userId);
    const recipe = await this.recipeRepository.findOne({ where: { id: recipeId } });
    if (!recipe) {
      throw new NotFoundException('菜谱不存在');
    }
    const exists = collection.recipes.some((item) => item.id === recipeId);
    if (!exists) {
      collection.recipes = [...collection.recipes, recipe];
      await this.collectionRepository.save(collection);
    }
    return this.findOwned(id, userId);
  }

  async removeRecipe(id: number, userId: number, recipeId: number): Promise<Collection> {
    const collection = await this.findOwned(id, userId);
    collection.recipes = collection.recipes.filter((recipe) => recipe.id !== recipeId);
    await this.collectionRepository.save(collection);
    return this.findOwned(id, userId);
  }

  async share(id: number, userId: number): Promise<Collection> {
    const collection = await this.findOwned(id, userId);
    if (!collection.share_token) {
      collection.share_token = randomBytes(32).toString('hex');
      collection.shared_at = new Date();
      collection.is_public = true;
      await this.collectionRepository.save(collection);
    }
    return this.findOwned(id, userId);
  }

  async unshare(id: number, userId: number): Promise<Collection> {
    const collection = await this.findOwned(id, userId);
    collection.share_token = null;
    collection.shared_at = null;
    collection.is_public = false;
    await this.collectionRepository.save(collection);
    return this.findOwned(id, userId);
  }

  async findByShareToken(token: string): Promise<Collection> {
    const collection = await this.collectionRepository.findOne({
      where: { share_token: token },
      relations: { recipes: { author: true }, user: true },
    });
    if (!collection) {
      throw new NotFoundException('分享链接无效或已过期');
    }
    return collection;
  }

  private async findOwned(id: number, userId: number): Promise<Collection> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
      relations: { recipes: { author: true } },
    });
    if (!collection) {
      throw new NotFoundException('收藏夹不存在');
    }
    if (collection.user_id !== userId) {
      throw new ForbiddenException('无权操作该收藏夹');
    }
    return collection;
  }
}
