import { Raw } from 'typeorm';

import { BaseServices } from '../baseService.services';

import { ProductModel } from '../../database/repository/product/product.model';
import { CreateProductDto } from '../../database/repository/product/product.dto';

import { ProductEntity } from '../../entities/productEntity';
import { CategoryEntity } from '../../entities/categoryEntity';

import {
  BadRequestError,
  NotFoundError,
} from '../../core/ApiError';

class ProductService extends BaseServices<
  ProductModel,
  CreateProductDto
> {
  public getModel(): ProductModel {
    return new ProductModel();
  }

  public getDTO(): new () => CreateProductDto {
    return CreateProductDto;
  }

  public getModuleName(): string {
    return 'Product';
  }

  public async createProduct(
    model: ProductModel
  ): Promise<ProductModel> {
    const sku = model.sku.trim().toUpperCase();

    const existingProduct =
      await ProductEntity.findOne({
        where: {
          sku: Raw(
            (alias) =>
              `LOWER(${alias}) = LOWER(:sku)`,
            {
              sku,
            }
          ),
          is_delete: 0,
        },
      });

    if (existingProduct) {
      throw new BadRequestError(
        'Product SKU already exists'
      );
    }

    await this.validateCategory(
      model.category_id
    );

    this.validatePrice(model.price);
    this.validateStock(
      model.stock_quantity
    );

    const product =
      ProductEntity.create({
        sku,
        name: model.name.trim(),
        description:
          model.description?.trim() || null,
        price: model.price,
        stock_quantity:
          model.stock_quantity,
        is_active:
          model.is_active,
        category_id:
          model.category_id,
      });

    const savedProduct =
      await product.save();

    return this.toModel(savedProduct);
  }

  public async getProducts(
    search?: string,
    categoryId?: number
  ): Promise<ProductModel[]> {
    const query =
      ProductEntity.createQueryBuilder(
        'product'
      )
        .where(
          'product.is_delete = :isDelete',
          {
            isDelete: 0,
          }
        )
        .andWhere(
          'product.is_active = :isActive',
          {
            isActive: true,
          }
        );

    if (search?.trim()) {
      query.andWhere(
        `(
          LOWER(product.name) LIKE LOWER(:search)
          OR
          LOWER(product.sku) LIKE LOWER(:search)
        )`,
        {
          search: `%${search.trim()}%`,
        }
      );
    }

    if (categoryId !== undefined) {
      query.andWhere(
        'product.category_id = :categoryId',
        {
          categoryId,
        }
      );
    }

    const products =
      await query
        .orderBy(
          'product.name',
          'ASC'
        )
        .getMany();

    return products.map(
      (product) =>
        this.toModel(product)
    );
  }

  public async getProductById(
    productId: number
  ): Promise<ProductModel> {
    const product =
      await ProductEntity.findOne({
        where: {
          id: productId,
          is_delete: 0,
          is_active: true,
        },
      });

    if (!product) {
      throw new NotFoundError(
        'Product not found'
      );
    }

    return this.toModel(product);
  }

  public async updateProduct(
    productId: number,
    model: Partial<ProductModel>
  ): Promise<ProductModel> {
    const product =
      await ProductEntity.findOne({
        where: {
          id: productId,
          is_delete: 0,
        },
      });

    if (!product) {
      throw new NotFoundError(
        'Product not found'
      );
    }

    if (model.sku !== undefined) {
      const sku =
        model.sku.trim().toUpperCase();

      const duplicateProduct =
        await ProductEntity.findOne({
          where: {
            sku: Raw(
              (alias) =>
                `LOWER(${alias}) = LOWER(:sku)`,
              {
                sku,
              }
            ),
            is_delete: 0,
          },
        });

      if (
        duplicateProduct &&
        duplicateProduct.id !== productId
      ) {
        throw new BadRequestError(
          'Product SKU already exists'
        );
      }

      product.sku = sku;
    }

    if (model.name !== undefined) {
      product.name =
        model.name.trim();
    }

    if (model.description !== undefined) {
      product.description =
        model.description?.trim() ||
        null;
    }

    if (model.price !== undefined) {
      this.validatePrice(
        model.price
      );

      product.price =
        model.price;
    }

    if (
      model.stock_quantity !== undefined
    ) {
      this.validateStock(
        model.stock_quantity
      );

      product.stock_quantity =
        model.stock_quantity;
    }

    if (model.category_id !== undefined) {
      await this.validateCategory(
        model.category_id
      );

      product.category_id =
        model.category_id;
    }

    if (model.is_active !== undefined) {
      product.is_active =
        model.is_active;
    }

    const updatedProduct =
      await product.save();

    return this.toModel(
      updatedProduct
    );
  }

  public async deactivateProduct(
    productId: number
  ): Promise<ProductModel> {
    const product =
      await ProductEntity.findOne({
        where: {
          id: productId,
          is_delete: 0,
        },
      });

    if (!product) {
      throw new NotFoundError(
        'Product not found'
      );
    }

    product.is_active = false;

    const updatedProduct =
      await product.save();

    return this.toModel(
      updatedProduct
    );
  }

  private async validateCategory(
    categoryId: number
  ): Promise<void> {
    const category =
      await CategoryEntity.findOne({
        where: {
          id: categoryId,
          is_delete: 0,
          is_active: true,
        },
      });

    if (!category) {
      throw new BadRequestError(
        'Invalid or inactive category'
      );
    }
  }

  private validatePrice(
    price: string
  ): void {
    const numericPrice =
      Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      throw new BadRequestError(
        'Product price must be greater than 0'
      );
    }
  }

  private validateStock(
    stockQuantity: number
  ): void {
    if (
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0
    ) {
      throw new BadRequestError(
        'Stock quantity cannot be negative'
      );
    }
  }

  private toModel(
    product: ProductEntity
  ): ProductModel {
    const model =
      this.getModel();

    model.id = product.id;
    model.sku = product.sku;
    model.name = product.name;
    model.description =
      product.description;
    model.price = product.price;
    model.stock_quantity =
      product.stock_quantity;
    model.is_active =
      product.is_active;
    model.category_id =
      product.category_id;

    return model;
  }
}

export default ProductService;