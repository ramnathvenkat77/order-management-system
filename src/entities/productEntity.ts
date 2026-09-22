import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { InferencingEntity } from './inferenceEntity';
import { CategoryEntity } from './categoryEntity';

@Entity('products')
export class ProductEntity extends InferencingEntity {
  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: false,
  })
  sku!: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
  })
  name!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  price!: string;

  @Column({
    type: 'integer',
    default: 0,
  })
  stock_quantity!: number;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @Column({
    type: 'integer',
    nullable: false,
  })
  category_id!: number;

  @ManyToOne(
    () => CategoryEntity,
    {
      nullable: false,
    }
  )
  @JoinColumn({
    name: 'category_id',
  })
  category!: CategoryEntity;
}