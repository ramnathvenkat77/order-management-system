import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';

import { InferencingEntity } from './inferenceEntity';
import { CartEntity } from './cartEntity';
import { ProductEntity } from './productEntity';

@Entity('cart_items')
@Unique(['cart_id', 'product_id'])
@Check(`"quantity" > 0`)
export class CartItemEntity extends InferencingEntity {
  @Column({
    type: 'integer',
    nullable: false,
  })
  cart_id!: number;

  @ManyToOne(
    () => CartEntity,
    {
      nullable: false,
      onDelete: 'CASCADE',
    }
  )
  @JoinColumn({
    name: 'cart_id',
  })
  cart!: CartEntity;

  @Column({
    type: 'integer',
    nullable: false,
  })
  product_id!: number;

  @ManyToOne(
    () => ProductEntity,
    {
      nullable: false,
    }
  )
  @JoinColumn({
    name: 'product_id',
  })
  product!: ProductEntity;

  @Column({
    type: 'integer',
    nullable: false,
  })
  quantity!: number;
}