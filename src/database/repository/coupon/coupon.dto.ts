import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

import {
  CouponType,
} from '../../../entities/couponEntity';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  code!: string;

  @IsEnum(CouponType)
  type!: CouponType;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message:
      'discount_value must be a positive numeric value with up to 2 decimal places',
  })
  discount_value!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message:
      'minimum_order_value must be numeric with up to 2 decimal places',
  })
  minimum_order_value?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message:
      'maximum_discount must be numeric with up to 2 decimal places',
  })
  maximum_discount?: string | null;

  @IsOptional()
  @IsDateString()
  start_date?: string | null;

  @IsOptional()
  @IsDateString()
  expiry_date?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  usage_limit?: number | null;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateCouponDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  code?: string;

  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  discount_value?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  minimum_order_value?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  maximum_discount?: string | null;

  @IsOptional()
  @IsDateString()
  start_date?: string | null;

  @IsOptional()
  @IsDateString()
  expiry_date?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  usage_limit?: number | null;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}