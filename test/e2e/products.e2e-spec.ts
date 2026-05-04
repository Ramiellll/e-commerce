import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SequelizeModule } from '@nestjs/sequelize';
import request from 'supertest';

import { Product } from '../../src/products/entities/product.entity';
import { ProductsModule } from '../../src/products/products.module';

describe('Products (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot({
          dialect: 'sqlite',
          storage: ':memory:',
          models: [Product],
          autoLoadModels: true,
          synchronize: true,
          logging: false,
        }),
        ProductsModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const sample = {
    productToken: 'tok-abc',
    name: 'Hoodie',
    price: 49.95,
    stock: 100,
  };

  it('POST /products creates a product', async () => {
    const res = await request(app.getHttpServer())
      .post('/products')
      .send(sample)
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(Number),
      productToken: sample.productToken,
      name: sample.name,
      stock: sample.stock,
    });
  });

  it('POST /products rejects invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/products')
      .send({ productToken: '', name: '', price: -1, stock: -1 })
      .expect(400);
  });

  it('POST /products rejects duplicate productToken with 409', async () => {
    await request(app.getHttpServer())
      .post('/products')
      .send({ ...sample, productToken: 'tok-dup', name: 'A' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/products')
      .send({ ...sample, productToken: 'tok-dup', name: 'B' })
      .expect(409);
  });

  it('GET /products returns paginated data', async () => {
    const res = await request(app.getHttpServer())
      .get('/products?page=1&limit=10')
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10 });
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /products/:id returns 404 for missing product', async () => {
    await request(app.getHttpServer()).get('/products/999999').expect(404);
  });

  it('PATCH /products/:id/stock updates stock', async () => {
    const created = await request(app.getHttpServer())
      .post('/products')
      .send({ ...sample, productToken: 'tok-stock' })
      .expect(201);

    const id = created.body.id;
    const updated = await request(app.getHttpServer())
      .patch(`/products/${id}/stock`)
      .send({ stock: 7 })
      .expect(200);

    expect(updated.body.stock).toBe(7);
  });

  it('DELETE /products/:id removes the product', async () => {
    const created = await request(app.getHttpServer())
      .post('/products')
      .send({ ...sample, productToken: 'tok-del' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/products/${created.body.id}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/products/${created.body.id}`)
      .expect(404);
  });
});
