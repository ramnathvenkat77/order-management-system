import { InferModel } from '../InferModel/InferModel.model';
import { CouponType } from '../../../entities/couponEntity';

export class CouponModel extends InferModel {
  code: string = '';

  type: CouponType = CouponType.PERCENTAGE;

  discount_value: string = '0.00';

  minimum_order_value: string | null = null;

  maximum_discount: string | null = null;

  start_date: Date | null = null;

  expiry_date: Date | null = null;

  usage_limit: number | null = null;

  used_count: number = 0;

  is_active: boolean = true;
}