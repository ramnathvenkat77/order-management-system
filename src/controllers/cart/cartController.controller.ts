import express from 'express';

import { BaseController } from '../baseController.controller';
import { APP_ROUTES } from '../../core/AppRoutes';
import { UserRole } from '../../entities/usersEntity';
import CartService from '../../services/cart/cartService.services';

import {
  AddCartItemDto,
  UpdateCartItemDto,
} from '../../database/repository/cart/cart.dto';

import authMiddleware from '../../middlewares/authMiddleware';
import { authorizeRoles } from '../../middlewares/roleMiddleware';
import validationFDMiddleware from '../../middlewares/validationFormData.middleware';

import {
  ApiError,
  AuthFailureError,
  BadRequestError,
  InternalError,
} from '../../core/ApiError';

import { SuccessResponse } from '../../core/ApiResponse';

export class CartController extends BaseController {
  constructor(
    protected path: APP_ROUTES.CART = APP_ROUTES.CART,
    public router = express.Router(),
    public service: CartService = new CartService()
  ) {
    super(path, router, service);
  }

  public _initialiseRoutes(): void {
    this.router.get(
      this.path,
      authMiddleware,
    authorizeRoles(UserRole.CUSTOMER),
      this.getCart.bind(this)
    );

    this.router.post(
      `${this.path}/items`,
      authMiddleware,
      authorizeRoles(UserRole.CUSTOMER),
      validationFDMiddleware(AddCartItemDto),
      this.addItem.bind(this)
    );

    this.router.patch(
      `${this.path}/items/:id`,
      authMiddleware,
      authorizeRoles(UserRole.CUSTOMER),
      validationFDMiddleware(UpdateCartItemDto),
      this.updateItem.bind(this)
    );

    this.router.delete(
      `${this.path}/items/:id`,
      authMiddleware,
      authorizeRoles(UserRole.CUSTOMER),
      this.removeItem.bind(this)
    );
  }

  private async getCart(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const userId = this.getUserId(req);

      const cart =
        await this.service.getCart(userId);

      new SuccessResponse(
        'Cart fetched successfully',
        cart
      ).send(res);
    } catch (error) {
      this.handleControllerError(error, res);
    }
  }

  private async addItem(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const userId = this.getUserId(req);

      const {
        product_id,
        quantity,
      } = req.body as AddCartItemDto;

      const cart =
        await this.service.addItem(
          userId,
          product_id,
          quantity
        );

      new SuccessResponse(
        'Product added to cart successfully',
        cart
      ).send(res);
    } catch (error) {
      this.handleControllerError(error, res);
    }
  }

  private async updateItem(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const userId = this.getUserId(req);

      const itemId =
        this.validateId(req.params.id);

      const {
        quantity,
      } = req.body as UpdateCartItemDto;

      const cart =
        await this.service.updateItem(
          userId,
          itemId,
          quantity
        );

      new SuccessResponse(
        'Cart item updated successfully',
        cart
      ).send(res);
    } catch (error) {
      this.handleControllerError(error, res);
    }
  }

  private async removeItem(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const userId = this.getUserId(req);

      const itemId =
        this.validateId(req.params.id);

      const cart =
        await this.service.removeItem(
          userId,
          itemId
        );

      new SuccessResponse(
        'Cart item removed successfully',
        cart
      ).send(res);
    } catch (error) {
      this.handleControllerError(error, res);
    }
  }

  private getUserId(
    req: express.Request
  ): number {
    const authenticatedRequest =
      req as express.Request & {
        authUser?: {
          userId: number;
          email: string;
          role: string;
        };
      };

    const userId =
      authenticatedRequest.authUser?.userId;

    if (!userId) {
      throw new AuthFailureError(
        'Authenticated user not found'
      );
    }

    return userId;
  }

private validateId(
  value: string | string[]
): number {
  if (Array.isArray(value)) {
    throw new BadRequestError(
      'Invalid cart item id'
    );
  }

  const id = Number(value);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new BadRequestError(
      'Invalid cart item id'
    );
  }

  return id;
}

  private handleControllerError(
    error: unknown,
    res: express.Response
  ): void {
    if (error instanceof ApiError) {
      ApiError.handle(error, res);
      return;
    }

    console.error(error);

    ApiError.handle(
      new InternalError(
        'Something went wrong'
      ),
      res
    );
  }
}