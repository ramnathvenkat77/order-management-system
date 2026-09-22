import { Raw } from 'typeorm';

import { BaseServices } from '../baseService.services';

import { CategoryModel } from '../../database/repository/category/category.model';
import { CreateCategoryDto } from '../../database/repository/category/category.dto';

import { CategoryEntity } from '../../entities/categoryEntity';

import {
  BadRequestError,
  NotFoundError,
} from '../../core/ApiError';

class CategoryService extends BaseServices<
  CategoryModel,
  CreateCategoryDto
> {
  public getModel(): CategoryModel {
    return new CategoryModel();
  }

  public getDTO(): new () => CreateCategoryDto {
    return CreateCategoryDto;
  }

  public getModuleName(): string {
    return 'Category';
  }

  public async createCategory(
    model: CategoryModel
  ): Promise<CategoryModel> {
    const categoryName =
      model.name.trim();

    const existingCategory =
      await CategoryEntity.findOne({
        where: {
          name: Raw(
            (alias) =>
              `LOWER(${alias}) = LOWER(:name)`,
            {
              name: categoryName,
            }
          ),
          is_delete: 0,
        },
      });

    if (existingCategory) {
      throw new BadRequestError(
        'Category already exists'
      );
    }

    const category =
      CategoryEntity.create({
        name: categoryName,
        description:
          model.description?.trim() || null,
        is_active: model.is_active,
      });

    const savedCategory =
      await category.save();

    return this.toModel(savedCategory);
  }

  public async getCategories(): Promise<
    CategoryModel[]
  > {
    const categories =
      await CategoryEntity.find({
        where: {
          is_delete: 0,
          is_active: true,
        },
        order: {
          name: 'ASC',
        },
      });

    return categories.map(
      (category) =>
        this.toModel(category)
    );
  }

  public async updateCategory(
    categoryId: number,
    model: Partial<CategoryModel>
  ): Promise<CategoryModel> {
    const category =
      await CategoryEntity.findOne({
        where: {
          id: categoryId,
          is_delete: 0,
        },
      });

    if (!category) {
      throw new NotFoundError(
        'Category not found'
      );
    }

    if (model.name !== undefined) {
      const categoryName =
        model.name.trim();

      const duplicateCategory =
        await CategoryEntity.findOne({
          where: {
            name: Raw(
              (alias) =>
                `LOWER(${alias}) = LOWER(:name)`,
              {
                name: categoryName,
              }
            ),
            is_delete: 0,
          },
        });

      if (
        duplicateCategory &&
        duplicateCategory.id !== categoryId
      ) {
        throw new BadRequestError(
          'Category already exists'
        );
      }

      category.name = categoryName;
    }

    if (model.description !== undefined) {
      category.description =
        model.description?.trim() || null;
    }

    if (model.is_active !== undefined) {
      category.is_active =
        model.is_active;
    }

    const updatedCategory =
      await category.save();

    return this.toModel(
      updatedCategory
    );
  }

  public async deactivateCategory(
    categoryId: number
  ): Promise<CategoryModel> {
    const category =
      await CategoryEntity.findOne({
        where: {
          id: categoryId,
          is_delete: 0,
        },
      });

    if (!category) {
      throw new NotFoundError(
        'Category not found'
      );
    }

    category.is_active = false;

    const updatedCategory =
      await category.save();

    return this.toModel(
      updatedCategory
    );
  }

  private toModel(
    category: CategoryEntity
  ): CategoryModel {
    const model =
      this.getModel();

    model.id = category.id;
    model.name = category.name;
    model.description =
      category.description;
    model.is_active =
      category.is_active;

    return model;
  }
}

export default CategoryService;