import { Column, Entity } from 'typeorm';
import { InferencingEntity } from './inferenceEntity';

@Entity('categories')
export class CategoryEntity extends InferencingEntity {
  @Column({
    type: 'varchar',
    length: 150,
    unique: true,
    nullable: false,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  description!: string | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;
}