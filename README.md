# E-commerce

A NestJS microservice that manages products in a MySQL database via Sequelize.

## Stack

- **NestJS 8** — HTTP framework with DI, decorators, and pipes.
- **Sequelize 6** + **sequelize-typescript** — ORM with typed model definitions.
- **MySQL 8** — primary datastore (SQLite in-memory is supported for tests).
- **class-validator** / **class-transformer** — DTO validation and request transformation.

## Project layout

```
src/
├── app.controller.ts
├── app.module.ts                    # root module — Sequelize + ProductsModule
├── app.service.ts
├── main.ts
├── config/
│   └── database.config.ts
└── products/
    ├── dto/
    │   ├── create-product.dto.ts
    │   ├── paginated-products.dto.ts
    │   ├── pagination.dto.ts
    │   └── update-product-stock.dto.ts
    ├── entities/
    │   └── product.entity.ts
    ├── products.controller.ts
    ├── products.module.ts
    └── products.service.ts
test/
├── unit/                            # `pnpm test`
│   ├── app.controller.spec.ts
│   ├── app.module.spec.ts
│   ├── config/
│   │   └── database.config.spec.ts
│   └── products/
│       ├── products.controller.spec.ts
│       └── products.service.spec.ts
└── e2e/                             # `pnpm test:e2e`
    ├── app.e2e-spec.ts
    └── products.e2e-spec.ts
```

## Database

Product model: [src/products/entities/product.entity.ts](src/products/entities/product.entity.ts):

| column         | type                  | notes                         |
| -------------- | --------------------- | ----------------------------- |
| `id`           | INT UNSIGNED          | PK, auto-increment            |
| `productToken` | VARCHAR(64)           | unique, not null              |
| `name`         | VARCHAR(255)          | not null                      |
| `price`        | DECIMAL(12, 2)        | not null                      |
| `stock`        | INT UNSIGNED          | not null, default `0`         |
| `createdAt`    | DATETIME              | managed by Sequelize          |
| `updatedAt`    | DATETIME              | managed by Sequelize          |

Equivalent DDL:

```sql
CREATE TABLE products (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  productToken  VARCHAR(64)  NOT NULL UNIQUE,
  name          VARCHAR(255) NOT NULL,
  price         DECIMAL(12, 2) NOT NULL,
  stock         INT UNSIGNED NOT NULL DEFAULT 0,
  createdAt     DATETIME(6) NOT NULL,
  updatedAt     DATETIME(6) NOT NULL
);
```

For local bootstrapping you can set `DB_SYNC=true` and Sequelize will create the table from the model. Do **not** enable this in production.

## Configuration

Set the following environment variables (a `.env` file is auto-loaded by `@nestjs/config`):

| variable      | default       | description                                     |
| ------------- | ------------- | ----------------------------------------------- |
| `PORT`        | `3000`        | HTTP port                                       |
| `DB_DIALECT`  | `mysql`       | `mysql` or `sqlite` (tests)                     |
| `DB_HOST`     | `localhost`   |                                                 |
| `DB_PORT`     | `3306`        |                                                 |
| `DB_USERNAME` | `root`        |                                                 |
| `DB_PASSWORD` | `""`          |                                                 |
| `DB_NAME`     | `ecommerce`   |                                                 |
| `DB_SYNC`     | `false`       | Set `true` to auto-create tables (dev only)     |
| `DB_LOGGING`  | `false`       | Set `true` to log SQL                           |

## Install & run

### Quick start with Docker

```bash
cp .env.example .env             # already provided with sane local defaults
docker compose up -d             # MySQL 8 on :3306
pnpm install
pnpm start:dev                   # boots Nest, syncs tables (DB_SYNC=true), listens on :3000
```

Stop the database with `docker compose down`. To wipe data, add `-v`.

### Without Docker

```bash
mysql -u root -p -e "CREATE DATABASE ecommerce;"   # one-time
cp .env.example .env                               # then edit DB_* vars
pnpm install
pnpm start:dev
```

### Production

```bash
pnpm build && pnpm start:prod
```

Set `DB_SYNC=false` (or unset) in production — manage schema with the explicit DDL above or a dedicated migration tool.

## Testing

```bash
pnpm test               # unit tests (services, controllers)
pnpm test:e2e           # e2e — boots the HTTP layer against an in-memory SQLite DB
pnpm test:cov           # coverage
```

The e2e suite uses SQLite in-memory, so no MySQL instance is required.

## API

Interactive Swagger UI is mounted at **`http://localhost:3000/docs`** once the server is running. The OpenAPI JSON spec is available at `http://localhost:3000/docs-json`.

Base path: `/products`

### Create a product — `POST /products`

```http
POST /products
Content-Type: application/json

{
  "productToken": "SKU-001",
  "name": "Black Hoodie",
  "price": 49.95,
  "stock": 100
}
```

Response — `201 Created`:

```json
{
  "id": 1,
  "productToken": "SKU-001",
  "name": "Black Hoodie",
  "price": "49.95",
  "stock": 100,
  "createdAt": "2026-04-28T12:00:00.000Z",
  "updatedAt": "2026-04-28T12:00:00.000Z"
}
```

Error responses:
- `400 Bad Request` — invalid payload (missing field, negative price, etc.)
- `409 Conflict` — `productToken` already in use

### List products (paginated) — `GET /products`

Query params:
- `page` (int, ≥ 1, default `1`)
- `limit` (int, 1–100, default `20`)

```http
GET /products?page=1&limit=20
```

Response — `200 OK`:

```json
{
  "data": [
    { "id": 1, "productToken": "SKU-001", "name": "Black Hoodie", "price": "49.95", "stock": 100 }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Get a product — `GET /products/:id`

```http
GET /products/1
```

- `200 OK` with the product
- `404 Not Found` if the id does not exist

### Update stock — `PATCH /products/:id/stock`

```http
PATCH /products/1/stock
Content-Type: application/json

{ "stock": 42 }
```

- `200 OK` with the updated product
- `400 Bad Request` if `stock` is missing or negative
- `404 Not Found` if the id does not exist

### Delete a product — `DELETE /products/:id`

```http
DELETE /products/1
```

- `204 No Content` on success
- `404 Not Found` if the id does not exist

## End-to-end usage example (curl)

```bash
# 1. Create
curl -X POST http://localhost:3000/products \
  -H 'content-type: application/json' \
  -d '{"productToken":"SKU-001","name":"Black Hoodie","price":49.95,"stock":100}'

# 2. List
curl 'http://localhost:3000/products?page=1&limit=10'

# 3. Read one
curl http://localhost:3000/products/1

# 4. Update stock
curl -X PATCH http://localhost:3000/products/1/stock \
  -H 'content-type: application/json' \
  -d '{"stock":42}'

# 5. Delete
curl -X DELETE http://localhost:3000/products/1 -i
```

## Design notes

- **Validation** is enforced globally via a `ValidationPipe` configured with `whitelist`, `forbidNonWhitelisted`, and `transform` — unknown fields are stripped or rejected, and primitives are coerced from query strings.
- **Errors** are thrown as standard Nest exceptions (`NotFoundException`, `ConflictException`) so the framework maps them to correct HTTP status codes. Unique-constraint violations from Sequelize are translated to `409 Conflict` rather than leaking the DB error.
- **DI** is used end-to-end: the model is provided via `SequelizeModule.forFeature([Product])` and injected into the service with `@InjectModel(Product)`, which keeps the service trivially testable with mocks (see [src/products/products.service.spec.ts](src/products/products.service.spec.ts)).
- **Pagination** returns both rows and metadata (`total`, `page`, `limit`, `totalPages`) using `findAndCountAll` so clients can render pagers without a second request.
