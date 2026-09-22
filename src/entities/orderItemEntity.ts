import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { InferencingEntity } from './inferenceEntity';
import { OrderEntity } from './orderEntity';
import { ProductEntity } from './productEntity';

@Entity('order_items')
@Check(`"quantity" > 0`)
@Check(`"unit_price" >= 0`)
@Check(`"line_total" >= 0`)
export class OrderItemEntity extends InferencingEntity {
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
    type: 'integer',
    nullable: true,
  })
  product_id!: number | null;

  @ManyToOne(
    () => ProductEntity,
    {
      nullable: true,
      onDelete: 'SET NULL',
    }
  )
  @JoinColumn({
    name: 'product_id',
  })
  product!: ProductEntity | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  product_sku!: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
  })
  product_name!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  unit_price!: string;

  @Column({
    type: 'integer',
    nullable: false,
  })
  quantity!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  line_total!: string;
}