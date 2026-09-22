import express from 'express';

import { BaseController } from '../baseController.controller';
import { APP_ROUTES } from '../../core/AppRoutes';

import authMiddleware from '../../middlewares/authMiddleware';
import { authorizeRoles } from '../../middlewares/roleMiddleware';
import validationFDMiddleware from '../../middlewares/validationFormData.middleware';

import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../../database/repository/category/category.dto';

import CategoryService from '../../services/category/categoryService.services';

import {
  ApiError,
  BadRequestError,
  InternalError,
} from '../../core/ApiError';

import {
  SuccessResponse,
} from '../../core/ApiResponse';

import {
  UserRole,
} from '../../entities/usersEntity';

export class CategoryController extends BaseController {
  constructor(
    protected path: APP_ROUTES = APP_ROUTES.CATEGORIES,
    public router = express.Router(),
    public service: CategoryService =
      new CategoryService()
  ) {
    super(path, router, service);
  }

  public _initialiseRoutes(): void {
    this.router.get(
      this.path,
      this.getCategories.bind(this)
    );

    this.router.post(
      this.path,
      authMiddleware,
      authorizeRoles(UserRole.ADMIN),
      validationFDMiddleware(CreateCategoryDto),
      this.createCategory.bind(this)
    );

    this.router.patch(
      `${this.path}/:id`,
      authMiddleware,
      authorizeRoles(UserRole.ADMIN),
      validationFDMiddleware(UpdateCategoryDto),
      this.updateCategory.bind(this)
    );

    this.router.delete(
      `${this.path}/:id`,
      authMiddleware,
      authorizeRoles(UserRole.ADMIN),
      this.deactivateCategory.bind(this)
    );
  }

  private async getCategories(
    _req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const data =
        await this.service.getCategories();

      new SuccessResponse(
        'Categories fetched successfully',
        data
      ).send(res);
    } catch (error: unknown) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private async createCategory(
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
        await this.service.createCategory(
          model
        );

      new SuccessResponse(
        'Category created successfully',
        data
      ).send(res);
    } catch (error: unknown) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private async updateCategory(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const categoryId =
        Number(req.params.id);

      this.validateId(categoryId);

      const data =
        await this.service.updateCategory(
          categoryId,
          req.body
        );

      new SuccessResponse(
        'Category updated successfully',
        data
      ).send(res);
    } catch (error: unknown) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private async deactivateCategory(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const categoryId =
        Number(req.params.id);

      this.validateId(categoryId);

      const data =
        await this.service.deactivateCategory(
          categoryId
        );

      new SuccessResponse(
        'Category deactivated successfully',
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
    id: number
  ): void {
    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new BadRequestError(
        'Invalid category id'
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
      'Unexpected category error:',
      error
    );

    ApiError.handle(
      new InternalError(),
      res
    );
  }
}