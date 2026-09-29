import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAuditLogDto {
  @IsOptional()
  user_id?: number | null;

  @IsString()
  @IsNotEmpty()
  action!: string;

  @IsString()
  @IsNotEmpty()
  entity_type!: string;

  @IsOptional()
  @IsString()
  entity_id?: string | null;

  @IsOptional()
  metadata?: Record<string, unknown> | null;
}
