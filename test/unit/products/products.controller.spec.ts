import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from '../../../src/products/products.controller';
import { ProductsService } from '../../../src/products/products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<ProductsService>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      updateStock: jest.fn(),
      remove: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: serviceMock }],
    }).compile();

    controller = moduleRef.get(ProductsController);
    service = moduleRef.get(ProductsService) as jest.Mocked<ProductsService>;
  });

  it('delegates create to the service', async () => {
    const dto = {
      productToken: 't',
      name: 'n',
      price: 1,
      stock: 1,
    };
    const created = { id: 1, ...dto } as any;
    service.create.mockResolvedValue(created);

    await expect(controller.create(dto)).resolves.toBe(created);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('passes pagination through to findAll', async () => {
    const result = {
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
    service.findAll.mockResolvedValue(result);

    await expect(controller.findAll({ page: 1, limit: 20 })).resolves.toBe(
      result,
    );
    expect(service.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('delegates findOne with parsed id', async () => {
    const product = { id: 5 } as any;
    service.findOne.mockResolvedValue(product);

    await expect(controller.findOne(5)).resolves.toBe(product);
    expect(service.findOne).toHaveBeenCalledWith(5);
  });

  it('delegates updateStock', async () => {
    const product = { id: 5, stock: 9 } as any;
    service.updateStock.mockResolvedValue(product);

    await expect(controller.updateStock(5, { stock: 9 })).resolves.toBe(
      product,
    );
    expect(service.updateStock).toHaveBeenCalledWith(5, { stock: 9 });
  });

  it('delegates remove', async () => {
    service.remove.mockResolvedValue(undefined);

    await expect(controller.remove(2)).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(2);
  });
});
