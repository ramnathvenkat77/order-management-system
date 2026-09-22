import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { InferencingEntity } from './inferenceEntity';
import { UsersEntity } from './usersEntity';
import { AddressEntity } from './addressEntity';
import { CouponEntity } from './couponEntity';

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface DeliveryAddressSnapshot {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

@Entity('orders')
@Check(`"subtotal" >= 0`)
@Check(`"discount_amount" >= 0`)
@Check(`"tax_amount" >= 0`)
@Check(`"shipping_amount" >= 0`)
@Check(`"grand_total" >= 0`)
export class OrderEntity extends InferencingEntity {
  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: false,
  })
  order_number!: string;

  @Column({
    type: 'integer',
    nullable: false,
  })
  user_id!: number;

  @ManyToOne(
    () => UsersEntity,
    {
      nullable: false,
    }
  )
  @JoinColumn({
    name: 'user_id',
  })
  user!: UsersEntity;

  @Column({
    type: 'integer',
    nullable: true,
  })
  address_id!: number | null;

  @ManyToOne(
    () => AddressEntity,
    {
      nullable: true,
      onDelete: 'SET NULL',
    }
  )
  @JoinColumn({
    name: 'address_id',
  })
  address!: AddressEntity | null;

  @Column({
    type: 'jsonb',
    nullable: false,
  })
  delivery_address!: DeliveryAddressSnapshot;

  @Column({
    type: 'integer',
    nullable: true,
  })
  coupon_id!: number | null;

  @ManyToOne(
    () => CouponEntity,
    {
      nullable: true,
      onDelete: 'SET NULL',
    }
  )
  @JoinColumn({
    name: 'coupon_id',
  })
  coupon!: CouponEntity | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  subtotal!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  discount_amount!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  tax_amount!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  shipping_amount!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  grand_total!: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING_PAYMENT,
  })
  status!: OrderStatus;
}