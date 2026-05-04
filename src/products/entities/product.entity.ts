import { ApiProperty } from '@nestjs/swagger';
import { Optional } from 'sequelize';
import {
  AutoIncrement,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

export interface ProductAttributes {
  id: number;
  productToken: string;
  name: string;
  price: number;
  stock: number;
}

export type ProductCreationAttributes = Optional<
  ProductAttributes,
  'id' | 'stock'
>;

@Table({
  tableName: 'products',
  timestamps: true,
  underscored: false,
})
export class Product extends Model<
  ProductAttributes,
  ProductCreationAttributes
> {
  @ApiProperty({ example: 1 })
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER.UNSIGNED)
  id!: number;

  @ApiProperty({ example: 'SKU-001', maxLength: 64 })
  @Unique
  @Column({ type: DataType.STRING(64), allowNull: false })
  productToken!: string;

  @ApiProperty({ example: 'Black Hoodie', maxLength: 255 })
  @Column({ type: DataType.STRING(255), allowNull: false })
  name!: string;

  @ApiProperty({ example: '49.95', description: 'Stored as DECIMAL(12,2)' })
  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  price!: number;

  @ApiProperty({ example: 100, minimum: 0 })
  @Default(0)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  stock!: number;
}
