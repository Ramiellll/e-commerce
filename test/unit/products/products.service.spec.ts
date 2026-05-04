import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { UniqueConstraintError } from 'sequelize';

import { CreateProductDto } from '../../../src/products/dto/create-product.dto';
import { Product } from '../../../src/products/entities/product.entity';
import { ProductsService } from '../../../src/products/products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let model: {
    create: jest.Mock;
    findAndCountAll: jest.Mock;
    findByPk: jest.Mock;
    destroy: jest.Mock;
  };

  beforeEach(async () => {
    model = {
      create: jest.fn(),
      findAndCountAll: jest.fn(),
      findByPk: jest.fn(),
      destroy: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getModelToken(Product), useValue: model },
      ],
    }).compile();

    service = moduleRef.get<ProductsService>(ProductsService);
  });

  describe('create', () => {
    const dto: CreateProductDto = {
      productToken: 'tok-1',
      name: 'Widget',
      price: 9.99,
      stock: 5,
    };

    it('persists a new product', async () => {
      const created = { id: 1, ...dto };
      model.create.mockResolvedValue(created);

      await expect(service.create(dto)).resolves.toEqual(created);
      expect(model.create).toHaveBeenCalledWith(dto);
    });

    it('translates a unique-constraint violation into ConflictException', async () => {
      const err = new UniqueConstraintError({ errors: [] });
      model.create.mockRejectedValue(err);

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('returns paginated rows with metadata', async () => {
      model.findAndCountAll.mockResolvedValue({
        rows: [{ id: 1 }, { id: 2 }],
        count: 12,
      });

      const result = await service.findAll({ page: 2, limit: 5 });

      expect(model.findAndCountAll).toHaveBeenCalledWith({
        offset: 5,
        limit: 5,
        order: [['id', 'ASC']],
      });
      expect(result.meta).toEqual({
        total: 12,
        page: 2,
        limit: 5,
        totalPages: 3,
      });
      expect(result.data).toHaveLength(2);
    });

    it('reports 0 totalPages when there are no rows', async () => {
      model.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findOne', () => {
    it('returns the matching product', async () => {
      const product = { id: 7 };
      model.findByPk.mockResolvedValue(product);

      await expect(service.findOne(7)).resolves.toBe(product);
    });

    it('throws NotFoundException when missing', async () => {
      model.findByPk.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateStock', () => {
    it('saves the new stock value', async () => {
      const product = {
        id: 3,
        stock: 1,
        save: jest.fn().mockResolvedValue(undefined),
      };
      model.findByPk.mockResolvedValue(product);

      const result = await service.updateStock(3, { stock: 42 });

      expect(product.stock).toBe(42);
      expect(product.save).toHaveBeenCalled();
      expect(result).toBe(product);
    });
  });

  describe('remove', () => {
    it('deletes when found', async () => {
      model.destroy.mockResolvedValue(1);
      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(model.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('throws NotFoundException when nothing was deleted', async () => {
      model.destroy.mockResolvedValue(0);
      await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
