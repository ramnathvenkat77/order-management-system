import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { InferencingEntity } from './inferenceEntity';
import { OrderEntity } from './orderEntity';

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('payments')
export class PaymentEntity extends InferencingEntity {
  @Column({
    type: 'integer',
    nullable: false,
  })
  order_id!: number;

  @ManyToOne(
    () => OrderEntity,
    {
      nullable: false,
      onDelete: 'CASCADE',
    }
  )
  @JoinColumn({
    name: 'order_id',
  })
  order!: OrderEntity;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  amount!: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  provider!: string;

  @Column({
    type: 'varchar',
    length: 150,
    unique: true,
    nullable: false,
  })
  provider_reference!: string;
}