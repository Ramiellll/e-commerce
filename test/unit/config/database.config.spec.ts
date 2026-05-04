import { buildSequelizeOptions } from '../../../src/config/database.config';

describe('buildSequelizeOptions', () => {
  it('returns a SQLite in-memory config when DB_DIALECT=sqlite', () => {
    const opts = buildSequelizeOptions({ DB_DIALECT: 'sqlite' });

    expect(opts).toMatchObject({
      dialect: 'sqlite',
      storage: ':memory:',
      autoLoadModels: true,
      synchronize: true,
      logging: false,
    });
    expect(opts.models).toBeDefined();
    expect(opts.models?.length).toBeGreaterThan(0);
  });

  it('honours DB_STORAGE for sqlite', () => {
    const opts = buildSequelizeOptions({
      DB_DIALECT: 'sqlite',
      DB_STORAGE: '/tmp/test.sqlite',
    });

    expect(opts).toMatchObject({
      dialect: 'sqlite',
      storage: '/tmp/test.sqlite',
    });
  });

  it('builds a MySQL config from env vars by default', () => {
    const opts = buildSequelizeOptions({
      DB_HOST: 'db.internal',
      DB_PORT: '3307',
      DB_USERNAME: 'app',
      DB_PASSWORD: 'secret',
      DB_NAME: 'shop',
      DB_SYNC: 'true',
      DB_LOGGING: 'true',
    });

    expect(opts).toMatchObject({
      dialect: 'mysql',
      host: 'db.internal',
      port: 3307,
      username: 'app',
      password: 'secret',
      database: 'shop',
      synchronize: true,
      logging: true,
    });
  });

  it('falls back to sensible defaults when no env vars are set', () => {
    const opts = buildSequelizeOptions({});

    expect(opts).toMatchObject({
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'ecommerce',
      synchronize: false,
      logging: false,
    });
  });
});
