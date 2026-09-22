import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

import {
  OrderStatus,
} from '../../../entities/orderEntity';

export class CheckoutOrderDto {
  @IsInt()
  @Min(1)
  address_id!: number;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  coupon_code?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}