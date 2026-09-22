import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { InferencingEntity } from './inferenceEntity';
import { UsersEntity } from './usersEntity';

@Entity('addresses')
export class AddressEntity extends InferencingEntity {
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
    type: 'varchar',
    length: 150,
    nullable: false,
  })
  line1!: string;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  line2!: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  city!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  state!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
  })
  postal_code!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  country!: string;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_default!: boolean;
}