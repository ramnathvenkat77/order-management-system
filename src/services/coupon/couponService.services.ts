import { In, Raw } from 'typeorm';

import { BaseServices } from '../baseService.services';

import {
  CouponEntity,
  CouponType,
} from '../../entities/couponEntity';
import { CartEntity } from '../../entities/cartEntity';
import { CartItemEntity } from '../../entities/cartItemEntity';
import { ProductEntity } from '../../entities/productEntity';
import { AuditLogEntity } from '../../entities/auditLogEntity';

import {
  CouponModel,
} from '../../database/repository/coupon/coupon.model';

import {
  CreateCouponDto,
  UpdateCouponDto,
} from '../../database/repository/coupon/coupon.dto';

import {
  BadRequestError,
  NotFoundError,
} from '../../core/ApiError';

class CouponService extends BaseServices<
  CouponModel,
  CreateCouponDto
> {
  public getModel(): CouponModel {
    return new CouponModel();
  }

  public getDTO(): new () => CreateCouponDto {
    return CreateCouponDto;
  }

  public getModuleName(): string {
    return 'Coupon';
  }

  public async getCoupons(): Promise<CouponModel[]> {
    const coupons =
      await CouponEntity.find({
        where: {
          is_delete: 0,
        },
        order: {
          id: 'ASC',
        },
      });

    return coupons.map(
      (coupon) =>
        this.toModel(coupon)
    );
  }

  public async createCoupon(
    dto: CreateCouponDto
  ): Promise<CouponModel> {
    const code =
      dto.code.trim().toUpperCase();

    await this.ensureUniqueCode(code);

    this.validateDiscount(
      dto.type,
      dto.discount_value
    );

    this.validateOptionalMoney(
      dto.minimum_order_value,
      'minimum_order_value'
    );

    this.validateOptionalPositiveMoney(
      dto.maximum_discount,
      'maximum_discount'
    );

    const startDate =
      this.parseOptionalDate(
        dto.start_date
      );

    const expiryDate =
      this.parseOptionalDate(
        dto.expiry_date
      );

    this.validateDateRange(
      startDate,
      expiryDate
    );

    const coupon =
      CouponEntity.create({
        code,

        type: dto.type,

        discount_value:
          this.normalizeMoney(
            dto.discount_value
          ),

        minimum_order_value:
          dto.minimum_order_value !==
            undefined &&
          dto.minimum_order_value !== null
            ? this.normalizeMoney(
                dto.minimum_order_value
              )
            : null,

        maximum_discount:
          dto.maximum_discount !==
            undefined &&
          dto.maximum_discount !== null
            ? this.normalizeMoney(
                dto.maximum_discount
              )
            : null,

        start_date: startDate,

        expiry_date: expiryDate,

        usage_limit:
          dto.usage_limit ?? null,

        used_count: 0,

        is_active:
          dto.is_active ?? true,
      });

    const savedCoupon =
      await coupon.save();

    await AuditLogEntity.create({
      action: 'COUPON_CREATED',
      entity_type: 'COUPON',
      entity_id: String(savedCoupon.id),
      metadata: {
        code: savedCoupon.code,
        type: savedCoupon.type,
        discount_value: savedCoupon.discount_value,
      },
    }).save();

    return this.toModel(
      savedCoupon
    );
  }

  public async updateCoupon(
    couponId: number,
    dto: UpdateCouponDto
  ): Promise<CouponModel> {
    const coupon =
      await this.findCoupon(
        couponId
      );

    if (dto.code !== undefined) {
      const code =
        dto.code
          .trim()
          .toUpperCase();

      await this.ensureUniqueCode(
        code,
        coupon.id
      );

      coupon.code = code;
    }

    const finalType =
      dto.type ??
      coupon.type;

    const finalDiscountValue =
      dto.discount_value ??
      coupon.discount_value;

    this.validateDiscount(
      finalType,
      finalDiscountValue
    );

    if (dto.type !== undefined) {
      coupon.type = dto.type;
    }

    if (
      dto.discount_value !== undefined
    ) {
      coupon.discount_value =
        this.normalizeMoney(
          dto.discount_value
        );
    }

    if (
      dto.minimum_order_value !==
      undefined
    ) {
      if (
        dto.minimum_order_value === null
      ) {
        coupon.minimum_order_value =
          null;
      } else {
        this.validateOptionalMoney(
          dto.minimum_order_value,
          'minimum_order_value'
        );

        coupon.minimum_order_value =
          this.normalizeMoney(
            dto.minimum_order_value
          );
      }
    }

    if (
      dto.maximum_discount !== undefined
    ) {
      if (
        dto.maximum_discount === null
      ) {
        coupon.maximum_discount =
          null;
      } else {
        this.validateOptionalPositiveMoney(
          dto.maximum_discount,
          'maximum_discount'
        );

        coupon.maximum_discount =
          this.normalizeMoney(
            dto.maximum_discount
          );
      }
    }

    let startDate =
      coupon.start_date;

    let expiryDate =
      coupon.expiry_date;

    if (dto.start_date !== undefined) {
      startDate =
        this.parseOptionalDate(
          dto.start_date
        );
    }

    if (dto.expiry_date !== undefined) {
      expiryDate =
        this.parseOptionalDate(
          dto.expiry_date
        );
    }

    this.validateDateRange(
      startDate,
      expiryDate
    );

    coupon.start_date =
      startDate;

    coupon.expiry_date =
      expiryDate;

    if (
      dto.usage_limit !== undefined
    ) {
      coupon.usage_limit =
        dto.usage_limit;
    }

    if (
      dto.is_active !== undefined
    ) {
      coupon.is_active =
        dto.is_active;
    }

    const savedCoupon =
      await coupon.save();

    await AuditLogEntity.create({
      action: 'COUPON_UPDATED',
      entity_type: 'COUPON',
      entity_id: String(savedCoupon.id),
      metadata: {
        code: savedCoupon.code,
        type: savedCoupon.type,
        is_active: savedCoupon.is_active,
      },
    }).save();

    return this.toModel(
      savedCoupon
    );
  }

  public async deactivateCoupon(
    couponId: number
  ): Promise<CouponModel> {
    const coupon =
      await this.findCoupon(
        couponId
      );

    coupon.is_active = false;

    const savedCoupon =
      await coupon.save();

    await AuditLogEntity.create({
      action: 'COUPON_DEACTIVATED',
      entity_type: 'COUPON',
      entity_id: String(savedCoupon.id),
      metadata: {
        code: savedCoupon.code,
        is_active: false,
      },
    }).save();

    return this.toModel(
      savedCoupon
    );
  }

  private async findCoupon(
    couponId: number
  ): Promise<CouponEntity> {
    const coupon =
      await CouponEntity.findOne({
        where: {
          id: couponId,
          is_delete: 0,
        },
      });

    if (!coupon) {
      throw new NotFoundError(
        'Coupon not found'
      );
    }

    return coupon;
  }

  private async ensureUniqueCode(
    code: string,
    currentCouponId?: number
  ): Promise<void> {
    const existingCoupon =
      await CouponEntity.findOne({
        where: {
          code: Raw(
            (alias) =>
              `LOWER(${alias}) = LOWER(:code)`,
            {
              code,
            }
          ),
          is_delete: 0,
        },
      });

    if (
      existingCoupon &&
      existingCoupon.id !==
        currentCouponId
    ) {
      throw new BadRequestError(
        'Coupon code already exists'
      );
    }
  }

  private validateDiscount(
    type: CouponType,
    discountValue: string
  ): void {
    const value =
      Number(discountValue);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      throw new BadRequestError(
        'Discount value must be greater than 0'
      );
    }

    if (
      type ===
        CouponType.PERCENTAGE &&
      value > 100
    ) {
      throw new BadRequestError(
        'Percentage discount cannot exceed 100'
      );
    }
  }

  private validateOptionalMoney(
    value:
      | string
      | null
      | undefined,
    fieldName: string
  ): void {
    if (
      value === undefined ||
      value === null
    ) {
      return;
    }

    const numericValue =
      Number(value);

    if (
      !Number.isFinite(
        numericValue
      ) ||
      numericValue < 0
    ) {
      throw new BadRequestError(
        `${fieldName} cannot be negative`
      );
    }
  }

  private validateOptionalPositiveMoney(
    value:
      | string
      | null
      | undefined,
    fieldName: string
  ): void {
    if (
      value === undefined ||
      value === null
    ) {
      return;
    }

    const numericValue =
      Number(value);

    if (
      !Number.isFinite(
        numericValue
      ) ||
      numericValue <= 0
    ) {
      throw new BadRequestError(
        `${fieldName} must be greater than 0`
      );
    }
  }

  private parseOptionalDate(
    value:
      | string
      | null
      | undefined
  ): Date | null {
    if (
      value === undefined ||
      value === null
    ) {
      return null;
    }

    return new Date(value);
  }

  private validateDateRange(
    startDate: Date | null,
    expiryDate: Date | null
  ): void {
    if (
      startDate &&
      expiryDate &&
      expiryDate <= startDate
    ) {
      throw new BadRequestError(
        'Expiry date must be after start date'
      );
    }
  }

  private normalizeMoney(
    value: string
  ): string {
    return Number(value).toFixed(2);
  }

  private toModel(
    coupon: CouponEntity
  ): CouponModel {
    const model =
      new CouponModel();

    model.id =
      coupon.id;

    model.code =
      coupon.code;

    model.type =
      coupon.type;

    model.discount_value =
      coupon.discount_value;

    model.minimum_order_value =
      coupon.minimum_order_value;

    model.maximum_discount =
      coupon.maximum_discount;

    model.start_date =
      coupon.start_date;

    model.expiry_date =
      coupon.expiry_date;

    model.usage_limit =
      coupon.usage_limit;

    model.used_count =
      coupon.used_count;

    model.is_active =
      coupon.is_active;

    return model;
  }

  public async validateCouponForCart(
    userId: number,
    code: string
  ): Promise<CouponValidationResult> {
    const cart = await CartEntity.findOne({
      where: {
        user_id: userId,
        is_delete: 0,
      },
    });

    if (!cart) {
      throw new BadRequestError('Cart is empty');
    }

    const cartItems = await CartItemEntity.find({
      where: {
        cart_id: cart.id,
        is_delete: 0,
      },
    });

    if (cartItems.length === 0) {
      throw new BadRequestError('Cart is empty');
    }

    const productIds = cartItems.map((item) => item.product_id);
    const products = await ProductEntity.find({
      where: {
        id: In(productIds),
        is_delete: 0,
        is_active: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotalInCents = 0;
    for (const item of cartItems) {
      const product = productMap.get(item.product_id);
      if (!product) {
        throw new BadRequestError('Product in cart is no longer available');
      }
      const unitPriceInCents = Math.round(Number(product.price) * 100);
      subtotalInCents += unitPriceInCents * item.quantity;
    }

    const normalizedCode = code.trim().toUpperCase();
    const coupon = await CouponEntity.findOne({
      where: {
        code: normalizedCode,
        is_active: true,
        is_delete: 0,
      },
    });

    if (!coupon) {
      throw new BadRequestError('Coupon is invalid or inactive');
    }

    const now = new Date();

    if (coupon.start_date && now < coupon.start_date) {
      throw new BadRequestError('Coupon is not active yet');
    }

    if (coupon.expiry_date && now > coupon.expiry_date) {
      throw new BadRequestError('Coupon has expired');
    }

    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      throw new BadRequestError('Coupon usage limit reached');
    }

    const minimumOrderInCents = coupon.minimum_order_value
      ? Math.round(Number(coupon.minimum_order_value) * 100)
      : 0;

    if (subtotalInCents < minimumOrderInCents) {
      throw new BadRequestError('Order does not meet coupon minimum value');
    }

    let discountInCents: number;

    if (coupon.type === CouponType.PERCENTAGE) {
      discountInCents = Math.round(
        subtotalInCents * (Number(coupon.discount_value) / 100)
      );
    } else {
      discountInCents = Math.round(Number(coupon.discount_value) * 100);
    }

    if (coupon.maximum_discount) {
      const maximumDiscountInCents = Math.round(
        Number(coupon.maximum_discount) * 100
      );
      discountInCents = Math.min(discountInCents, maximumDiscountInCents);
    }

    discountInCents = Math.min(discountInCents, subtotalInCents);

    return {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        discount_value: coupon.discount_value,
        minimum_order_value: coupon.minimum_order_value,
        maximum_discount: coupon.maximum_discount,
      },
      subtotal: (subtotalInCents / 100).toFixed(2),
      discount: (discountInCents / 100).toFixed(2),
      payable_amount: ((subtotalInCents - discountInCents) / 100).toFixed(2),
    };
  }
}

export interface CouponValidationResult {
  coupon: {
    id: number;
    code: string;
    type: CouponType;
    discount_value: string;
    minimum_order_value: string | null;
    maximum_discount: string | null;
  };
  subtotal: string;
  discount: string;
  payable_amount: string;
}

export default CouponService;