import {
  Check,
  Column,
  Entity,
} from 'typeorm';

import { InferencingEntity } from './inferenceEntity';

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

@Entity('coupons')
@Check(`"discount_value" > 0`)
@Check(`"used_count" >= 0`)
export class CouponEntity extends InferencingEntity {
  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: false,
  })
  code!: string;

  @Column({
    type: 'enum',
    enum: CouponType,
    nullable: false,
  })
  type!: CouponType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  discount_value!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  minimum_order_value!: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  maximum_discount!: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  start_date!: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  expiry_date!: Date | null;

  @Column({
    type: 'integer',
    nullable: true,
  })
  usage_limit!: number | null;

  @Column({
    type: 'integer',
    default: 0,
  })
  used_count!: number;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;
}