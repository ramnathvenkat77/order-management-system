import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  sku!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message:
      'price must be a positive numeric value with up to 2 decimal places',
  })
  price!: string;

  @IsInt()
  @Min(0)
  stock_quantity!: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsInt()
  @Min(1)
  category_id!: number;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  sku?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message:
      'price must be a positive numeric value with up to 2 decimal places',
  })
  price?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock_quantity?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  category_id?: number;
}