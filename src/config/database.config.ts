import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { Dialect } from 'sequelize';

import { Product } from '../products/entities/product.entity';

export const buildSequelizeOptions = (
  env: NodeJS.ProcessEnv = process.env,
): SequelizeModuleOptions => {
  const dialect = (env.DB_DIALECT ?? 'mysql') as Dialect;

  const baseModels = [Product];

  if (dialect === 'sqlite') {
    return {
      dialect: 'sqlite',
      storage: env.DB_STORAGE ?? ':memory:',
      models: baseModels,
      autoLoadModels: true,
      synchronize: true,
      logging: false,
    };
  }

  return {
    dialect,
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 3306),
    username: env.DB_USERNAME ?? 'root',
    password: env.DB_PASSWORD ?? '',
    database: env.DB_NAME ?? 'ecommerce',
    models: baseModels,
    autoLoadModels: true,
    synchronize: env.DB_SYNC === 'true',
    logging: env.DB_LOGGING === 'true',
  };
};
