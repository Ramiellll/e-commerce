import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { AppModule } from '../../src/app.module';
import { AppController } from '../../src/app.controller';
import { AppService } from '../../src/app.service';
import { ProductsService } from '../../src/products/products.service';

describe('AppModule', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DB_DIALECT = 'sqlite';
    process.env.DB_STORAGE = ':memory:';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    delete process.env.DB_DIALECT;
    delete process.env.DB_STORAGE;
  });

  it('resolves AppController and AppService', () => {
    expect(app.get(AppController)).toBeInstanceOf(AppController);
    expect(app.get(AppService)).toBeInstanceOf(AppService);
  });

  it('wires ProductsModule and exposes ProductsService', () => {
    const service = app.get(ProductsService);
    expect(service).toBeInstanceOf(ProductsService);
  });

  it('initialises Sequelize and connects to the database', async () => {
    const sequelize = app.get(Sequelize);
    await expect(sequelize.authenticate()).resolves.toBeUndefined();
  });
});
