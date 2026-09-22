import express from 'express';

import { BaseController } from '../baseController.controller';
import { APP_ROUTES } from '../../core/AppRoutes';

import CouponService from '../../services/coupon/couponService.services';

import {
  CreateCouponDto,
  UpdateCouponDto,
} from '../../database/repository/coupon/coupon.dto';

import authMiddleware from '../../middlewares/authMiddleware';

import {
  authorizeRoles,
} from '../../middlewares/roleMiddleware';

import validationFDMiddleware from '../../middlewares/validationFormData.middleware';
import { UserRole } from '../../entities/usersEntity';

import {
  ApiError,
  BadRequestError,
  InternalError,
} from '../../core/ApiError';

import {
  SuccessResponse,
} from '../../core/ApiResponse';

export class CouponController extends BaseController {
  constructor(
    protected path: APP_ROUTES.COUPONS =
      APP_ROUTES.COUPONS,

    public router =
      express.Router(),

    public service: CouponService =
      new CouponService()
  ) {
    super(
      path,
      router,
      service
    );
  }

  public _initialiseRoutes(): void {
    console.log(
  'Coupon routes initialized:',
  this.path
);
    this.router.get(
      this.path,
      authMiddleware,
      authorizeRoles(
        UserRole.ADMIN
      ),
      this.getCoupons.bind(this)
    );

    this.router.post(
      this.path,
      authMiddleware,
      authorizeRoles(
        UserRole.ADMIN
      ),
      validationFDMiddleware(
        CreateCouponDto
      ),
      this.createCoupon.bind(this)
    );

    this.router.patch(
      `${this.path}/:id`,
      authMiddleware,
      authorizeRoles(
        UserRole.ADMIN
      ),
      validationFDMiddleware(
        UpdateCouponDto
      ),
      this.updateCoupon.bind(this)
    );

    this.router.delete(
      `${this.path}/:id`,
      authMiddleware,
      authorizeRoles(
        UserRole.ADMIN
      ),
      this.deactivateCoupon.bind(this)
    );
  }

  private async getCoupons(
    _req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const coupons =
        await this.service.getCoupons();

      new SuccessResponse(
        'Coupons fetched successfully',
        coupons
      ).send(res);
    } catch (error) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private async createCoupon(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const dto =
        req.body as CreateCouponDto;

      const coupon =
        await this.service.createCoupon(
          dto
        );

      new SuccessResponse(
        'Coupon created successfully',
        coupon
      ).send(res);
    } catch (error) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private async updateCoupon(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const couponId =
        this.validateId(
          req.params.id
        );

      const dto =
        req.body as UpdateCouponDto;

      const coupon =
        await this.service.updateCoupon(
          couponId,
          dto
        );

      new SuccessResponse(
        'Coupon updated successfully',
        coupon
      ).send(res);
    } catch (error) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private async deactivateCoupon(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const couponId =
        this.validateId(
          req.params.id
        );

      const coupon =
        await this.service.deactivateCoupon(
          couponId
        );

      new SuccessResponse(
        'Coupon deactivated successfully',
        coupon
      ).send(res);
    } catch (error) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private validateId(
    value: string | string[]
  ): number {
    if (Array.isArray(value)) {
      throw new BadRequestError(
        'Invalid coupon id'
      );
    }

    const id = Number(value);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new BadRequestError(
        'Invalid coupon id'
      );
    }

    return id;
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

    console.error(error);

    ApiError.handle(
      new InternalError(
        'Something went wrong'
      ),
      res
    );
  }
}