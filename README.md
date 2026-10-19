# Enterprise Inventory: Orders & Products Management System

Повнофункціональна SPA/SSR система складського обліку приходів та продуктів (Fullstack Monorepo на NestJS, Next.js, SQLite, Google OAuth 2.0, WebSocket, GraphQL, EDA).

Реалізовано до рівня **Middle** згідно з вимогами `steps.md`.

---

## 🌟 Основні Можливості та Архітектура

- **Монорепозиторій**: `npm workspaces` + `Turborepo` (`apps/api`, `apps/web`, `packages/contracts`, `packages/eslint-config`).
- **Стиль коду та неймінг**: суворий `kebab-case` для всіх файлів та папок, Barrel Pattern (`./component-name/index.tsx`).
- **Семантичні Enums замість затичок з `app.js`**:
  - `isNew: 1 | 0` замінено на `condition: ProductCondition` (`NEW`, `USED`, `REFURBISHED`).
  - `isDefault: 0 | 1` замінено на `currencyRole: PriceCurrencyRole` (`PRIMARY_SETTLEMENT` [UAH], `VALUATION_REFERENCE` [USD]).
  - Додано `operationalStatus: ProductOperationalStatus` (`AVAILABLE` — «Свободен», `IN_REPAIR` — «В ремонте», «Закреплен»).
- **Pipeline-First Валідація (як у C# ASP.NET Core)**:
  - Без дублювання валідації на клієнті. Валідація виконується **до входу в метод контролера** за допомогою глобального NestJS `ValidationPipe` (`class-validator`).
  - Помилки повертаються у стандарті **RFC 7807 (`ProblemDetails`)** зі словником `errors: Record<field, string[]>`.
- **База даних**:
  - **SQLite** у корені монорепо (`./inventory.sqlite`, доданий у `.gitignore`).
  - Файл схеми для **MySQL Workbench**: `docs/db/schema.sql` (сумісний з MySQL 8.0+ та SQLite).
- **Зображення**:
  - Завантаження та збереження у `./uploads` з обов'язковою назвою **UUID v4** (`<uuid>.<ext>`).
  - Роздача статики через `@nestjs/serve-static` за маршрутом `/static/<uuid>.<ext>`.
- **Google OAuth 2.0 Авторизація**:
  - Токен зберігається у **`localStorage`** та передається у заголовку `Authorization: Bearer <token>`.
  - Доступний **Demo Google Login** для швидкої перевірки тестувальником без необхідності вказувати власні Google Cloud Console ключі.
- **WebSocket (Socket.io)**:
  - Лічильник активних сесій (вкладок) браузера у правому верхньому кутку в реальному часі.
  - Миттєва синхронізація додавання/видалення приходів і продуктів через сокети.
- **Event-Driven Architecture (EDA)**:
  - Доменні події `@nestjs/event-emitter` (`order.created`, `order.deleted`, `product.created`).
- **GraphQL**:
  - Apollo GraphQL Driver за адресою `/graphql` (запити `orders`, `products`).
- **Дизайн (Pixel-Perfect) та Покращення UI**:
  - Реалізовано перемикач **`Optimized Fit (1434px)`** (без горизонтального скролу, з липкою шапкою колонок) та **`Classic (2542px)`** (1-в-1 з оригінального скріншота).
- **Web Workers**:
  - Клієнтська фонова агрегація валют та індексація пошуку у воркері.
- **Карти та Графіки (Junior+)**:
  - Інтерактивна карта OpenStreetMap з локаціями складів та графіки Recharts.
- **Граф зв'язків (Middle)**:
  - Топологічний граф залежностей `Orders ↔ Products ↔ Groups ↔ Users`.

---

## 🚀 Швидкий Запуск

### Варіант 1: Локально (Node.js 20+)

1. **Встановлення залежностей**:
   ```bash
   npm install
   ```

2. **Запуск сидування БД (SQLite у корені)**:
   ```bash
   npm run seed
   ```

3. **Запуск обох додатків (API :4000 + Web :3000)**:
   ```bash
   npm run dev
   ```

4. Відкрийте браузер:
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:4000/api](http://localhost:4000/api)
   - **GraphQL Playground**: [http://localhost:4000/graphql](http://localhost:4000/graphql)

---

### Варіант 2: Запуск у Docker Compose

```bash
docker-compose up --build
```

---

## 🧪 Запуск Тестів

- **Unit-тести бекенду**:
  ```bash
  npx jest --config apps/api/jest.config.js
  ```
- **Unit-тести фронтенду (Redux slices)**:
  ```bash
  npx jest --config apps/web/jest.config.js
  ```
- **Type-check всього монорепо**:
  ```bash
  npm run build
  ```
