import { ApiProperty } from '@nestjs/swagger';

import { Product } from '../entities/product.entity';

export class PaginationMeta {
  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

export class PaginatedProductsDto {
  @ApiProperty({ type: () => Product, isArray: true })
  data!: Product[];

  @ApiProperty({ type: () => PaginationMeta })
  meta!: PaginationMeta;
}
