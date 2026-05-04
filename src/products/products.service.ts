import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel as NestInjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';

import { CreateProductDto } from './dto/create-product.dto';
import { PaginatedResult, PaginationDto } from './dto/pagination.dto';
import { UpdateProductStockDto } from './dto/update-product-stock.dto';
import { Product } from './entities/product.entity';

const InjectModel = NestInjectModel as (
  // eslint-disable-next-line @typescript-eslint/ban-types
  entity: Function,
  connection?: string,
) => ParameterDecorator;

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product) private readonly productModel: typeof Product,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    try {
      return await this.productModel.create(dto);
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(
          `Product with productToken "${dto.productToken}" already exists`,
        );
      }
      this.logger.error('Failed to create product', err as Error);
      throw err;
    }
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Product>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const { rows, count } = await this.productModel.findAndCountAll({
      offset,
      limit,
      order: [['id', 'ASC']],
    });

    return {
      data: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit) || 0,
      },
    };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productModel.findByPk(id);
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async updateStock(id: number, dto: UpdateProductStockDto): Promise<Product> {
    const product = await this.findOne(id);
    product.stock = dto.stock;
    await product.save();
    return product;
  }

  async remove(id: number): Promise<void> {
    const deleted = await this.productModel.destroy({ where: { id } });
    if (deleted === 0) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
  }
}
