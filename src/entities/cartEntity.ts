import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
} from 'typeorm';

import { InferencingEntity } from './inferenceEntity';
import { UsersEntity } from './usersEntity';

@Entity('carts')
export class CartEntity extends InferencingEntity {
  @Column({
    type: 'integer',
    unique: true,
    nullable: false,
  })
  user_id!: number;

  @OneToOne(
    () => UsersEntity,
    {
      nullable: false,
    }
  )
  @JoinColumn({
    name: 'user_id',
  })
  user!: UsersEntity;
}