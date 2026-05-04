import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Stable external identifier for the product',
    example: 'SKU-001',
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  productToken!: string;

  @ApiProperty({ example: 'Black Hoodie', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name!: string;

  @ApiProperty({ example: 49.95, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiProperty({ example: 100, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;
}
