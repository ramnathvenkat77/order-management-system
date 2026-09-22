import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { InferencingEntity } from './inferenceEntity';
import { UsersEntity } from './usersEntity';

@Entity('audit_logs')
export class AuditLogEntity extends InferencingEntity {
  @Column({
    type: 'integer',
    nullable: true,
  })
  user_id!: number | null;

  @ManyToOne(
    () => UsersEntity,
    {
      nullable: true,
      onDelete: 'SET NULL',
    }
  )
  @JoinColumn({
    name: 'user_id',
  })
  user!: UsersEntity | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  action!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  entity_type!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  entity_id!: string | null;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata!: Record<string, unknown> | null;
}