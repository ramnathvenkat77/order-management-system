import {
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class InferencingEntity extends BaseEntity {
  @PrimaryGeneratedColumn({
    type: 'integer',
  })
  id!: number;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  modified_at!: Date;

  @Column({
    type: 'smallint',
    default: 0,
  })
  is_delete!: number;
}