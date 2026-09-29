import express from 'express';

import { BaseController } from '../baseController.controller';
import { APP_ROUTES } from '../../core/AppRoutes';
import { UserRole } from '../../entities/usersEntity';
import AddressService from '../../services/address/addressService.services';

import {
  CreateAddressDto,
  UpdateAddressDto,
} from '../../database/repository/address/address.dto';

import authMiddleware from '../../middlewares/authMiddleware';

import {
  authorizeRoles,
} from '../../middlewares/roleMiddleware';

import validationFDMiddleware from '../../middlewares/validationFormData.middleware';

// COPY THE WORKING UserRole IMPORT FROM CartController HERE

import {
  ApiError,
  AuthFailureError,
  BadRequestError,
  InternalError,
} from '../../core/ApiError';

import {
  SuccessResponse,
} from '../../core/ApiResponse';

export class AddressController extends BaseController {
  constructor(
    protected path: APP_ROUTES.ADDRESSES =
      APP_ROUTES.ADDRESSES,

    public router =
      express.Router(),

    public service: AddressService =
      new AddressService()
  ) {
    super(
      path,
      router,
      service
    );
  }

  public _initialiseRoutes(): void {
    this.router.get(
      this.path,
      authMiddleware,
      authorizeRoles(
        UserRole.CUSTOMER
      ),
      this.getAddresses.bind(this)
    );

    this.router.post(
      this.path,
      authMiddleware,
      authorizeRoles(
        UserRole.CUSTOMER
      ),
      validationFDMiddleware(
        CreateAddressDto
      ),
      this.createAddress.bind(this)
    );

    this.router.patch(
      `${this.path}/:id`,
      authMiddleware,
      authorizeRoles(
        UserRole.CUSTOMER
      ),
      validationFDMiddleware(
        UpdateAddressDto
      ),
      this.updateAddress.bind(this)
    );

    this.router.delete(
      `${this.path}/:id`,
      authMiddleware,
      authorizeRoles(
        UserRole.CUSTOMER
      ),
      this.deleteAddress.bind(this)
    );
  }

  private async getAddresses(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const userId =
        this.getUserId(req);

      const addresses =
        await this.service.getAddresses(
          userId
        );

      new SuccessResponse(
        'Addresses fetched successfully',
        addresses
      ).send(res);
    } catch (error) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private async createAddress(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const userId =
        this.getUserId(req);

      const dto =
        req.body as CreateAddressDto;

      const address =
        await this.service.createAddress(
          userId,
          dto
        );

      new SuccessResponse(
        'Address created successfully',
        address
      ).send(res);
    } catch (error) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private async updateAddress(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const userId =
        this.getUserId(req);

      const addressId =
        this.validateId(
          req.params.id
        );

      const dto =
        req.body as UpdateAddressDto;

      const address =
        await this.service.updateAddress(
          userId,
          addressId,
          dto
        );

      new SuccessResponse(
        'Address updated successfully',
        address
      ).send(res);
    } catch (error) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private async deleteAddress(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const userId =
        this.getUserId(req);

      const addressId =
        this.validateId(
          req.params.id
        );

      await this.service.deleteAddress(
        userId,
        addressId
      );

      new SuccessResponse(
        'Address deleted successfully',
        {}
      ).send(res);
    } catch (error) {
      this.handleControllerError(
        error,
        res
      );
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
      authenticatedRequest
        .authUser?.userId;

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
        'Invalid address id'
      );
    }

    const id = Number(value);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new BadRequestError(
        'Invalid address id'
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
