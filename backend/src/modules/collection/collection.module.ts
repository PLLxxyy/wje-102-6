import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from '../recipe/recipe.entity';
import { OperationLogModule } from '../operation-log/operation-log.module';
import { CollectionController } from './collection.controller';
import { Collection } from './collection.entity';
import { CollectionService } from './collection.service';

@Module({
  imports: [TypeOrmModule.forFeature([Collection, Recipe]), OperationLogModule],
  controllers: [CollectionController],
  providers: [CollectionService],
  exports: [CollectionService],
})
export class CollectionModule {}
