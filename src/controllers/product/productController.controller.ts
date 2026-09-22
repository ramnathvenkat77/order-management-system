import express from 'express';

import { BaseController } from '../baseController.controller';
import { APP_ROUTES } from '../../core/AppRoutes';

import authMiddleware from '../../middlewares/authMiddleware';
import { authorizeRoles } from '../../middlewares/roleMiddleware';
import validationFDMiddleware from '../../middlewares/validationFormData.middleware';

import {
  CreateProductDto,
  UpdateProductDto,
} from '../../database/repository/product/product.dto';

import ProductService from '../../services/product/productService.services';

import {
  ApiError,
  BadRequestError,
  InternalError,
} from '../../core/ApiError';

import { SuccessResponse } from '../../core/ApiResponse';

import { UserRole } from '../../entities/usersEntity';

export class ProductController extends BaseController {
  constructor(
    protected path: APP_ROUTES = APP_ROUTES.PRODUCTS,
    public router = express.Router(),
    public service: ProductService =
      new ProductService()
  ) {
    super(path, router, service);
  }

  public _initialiseRoutes(): void {
    console.log('Product routes initialized:', this.path);
    this.router.get(
      this.path,
      this.getProducts.bind(this)
    );

    this.router.get(
      `${this.path}/:id`,
      this.getProductById.bind(this)
    );

    this.router.post(
      this.path,
      authMiddleware,
      authorizeRoles(UserRole.ADMIN),
      validationFDMiddleware(CreateProductDto),
      this.createProduct.bind(this)
    );

    this.router.patch(
      `${this.path}/:id`,
      authMiddleware,
      authorizeRoles(UserRole.ADMIN),
      validationFDMiddleware(UpdateProductDto),
      this.updateProduct.bind(this)
    );

    this.router.delete(
      `${this.path}/:id`,
      authMiddleware,
      authorizeRoles(UserRole.ADMIN),
      this.deactivateProduct.bind(this)
    );
  }

  private async getProducts(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const search =
        typeof req.query.search === 'string'
          ? req.query.search
          : undefined;

      let categoryId: number | undefined;

      if (req.query.categoryId !== undefined) {
        if (
          typeof req.query.categoryId !==
          'string'
        ) {
          throw new BadRequestError(
            'Invalid category id'
          );
        }

        categoryId =
          Number(req.query.categoryId);

        this.validateId(
          categoryId,
          'category id'
        );
      }

      const data =
        await this.service.getProducts(
          search,
          categoryId
        );

      new SuccessResponse(
        'Products fetched successfully',
        data
      ).send(res);
    } catch (error: unknown) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private async getProductById(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const productId =
        Number(req.params.id);

      this.validateId(
        productId,
        'product id'
      );

      const data =
        await this.service.getProductById(
          productId
        );

      new SuccessResponse(
        'Product fetched successfully',
        data
      ).send(res);
    } catch (error: unknown) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private async createProduct(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const model =
        this.service.getModel();

      Object.assign(
        model,
        req.body
      );

      const data =
        await this.service.createProduct(
          model
        );

      new SuccessResponse(
        'Product created successfully',
        data
      ).send(res);
    } catch (error: unknown) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private async updateProduct(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const productId =
        Number(req.params.id);

      this.validateId(
        productId,
        'product id'
      );

      const data =
        await this.service.updateProduct(
          productId,
          req.body
        );

      new SuccessResponse(
        'Product updated successfully',
        data
      ).send(res);
    } catch (error: unknown) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private async deactivateProduct(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const productId =
        Number(req.params.id);

      this.validateId(
        productId,
        'product id'
      );

      const data =
        await this.service.deactivateProduct(
          productId
        );

      new SuccessResponse(
        'Product deactivated successfully',
        data
      ).send(res);
    } catch (error: unknown) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private validateId(
    id: number,
    fieldName: string
  ): void {
    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new BadRequestError(
        `Invalid ${fieldName}`
      );
    }
  }

  private handleControllerError(
    error: unknown,
    res: express.Response
  ): void {
    if (error instanceof ApiError) {
      ApiError.handle(
        error,
        res
      );

      return;
    }

    console.error(
      'Unexpected product error:',
      error
    );

    ApiError.handle(
      new InternalError(),
      res
    );
  }
}