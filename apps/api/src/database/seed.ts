import { DataSource } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import {
  CurrencyCode,
  PriceCurrencyRole,
  ProductCondition,
  ProductOperationalStatus,
  UserRole,
} from '@dzencode/contracts';
import {
  UserEntity,
  OrderEntity,
  GroupEntity,
  ProductEntity,
  ProductPriceEntity,
} from './entities';

function getDatabasePath(): string {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  let currentDir = __dirname;
  for (let i = 0; i < 5; i++) {
    const pkgPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.name === 'dzencode-inventory-monorepo') {
          return path.join(currentDir, 'inventory.sqlite');
        }
      } catch {}
    }
    const parent = path.dirname(currentDir);
    if (parent === currentDir) break;
    currentDir = parent;
  }
  return path.resolve(process.cwd(), 'inventory.sqlite');
}

export async function runSeed(dataSource?: DataSource) {
  let createdLocal = false;
  let ds = dataSource;

  if (!ds) {
    createdLocal = true;
    ds = new DataSource({
      type: 'sqlite',
      database: getDatabasePath(),
      entities: [
        UserEntity,
        OrderEntity,
        GroupEntity,
        ProductEntity,
        ProductPriceEntity,
      ],
      synchronize: true,
    });
    await ds.initialize();
  }

  const userRepo = ds.getRepository(UserEntity);
  const orderRepo = ds.getRepository(OrderEntity);
  const groupRepo = ds.getRepository(GroupEntity);
  const productRepo = ds.getRepository(ProductEntity);
  const priceRepo = ds.getRepository(ProductPriceEntity);

  const existingUsers = await userRepo.count();
  if (existingUsers > 0) {
    console.log('Database already seeded. Skipping.');
    if (createdLocal) await ds.destroy();
    return;
  }

  console.log('Seeding initial data...');

  // 1. Users
  const alexUser = userRepo.create({
    googleId: 'google-oauth-1082348761234',
    email: 'alex.khrystorozhdestvensky@gmail.com',
    fullName: 'Христорождественский Александр',
    avatarUrl: '/static/7c9e6679-7425-40de-944b-e07fc1f90ae7.png',
    role: UserRole.ADMIN,
  });
  await userRepo.save(alexUser);

  const demoUser = userRepo.create({
    googleId: 'google-oauth-998877665544',
    email: 'manager.demo@example.com',
    fullName: 'Дмитрий Коваленко',
    avatarUrl: '/static/7c9e6679-7425-40de-944b-e07fc1f90ae7.png',
    role: UserRole.MANAGER,
  });
  await userRepo.save(demoUser);

  // 2. Groups
  const group1 = groupRepo.create({
    title: 'Длинное предлинное длиннючее название группы',
    description: 'Основная группа складского оборудования и мониторов',
  });
  const group2 = groupRepo.create({
    title: 'Рабочие станции разработчиков',
    description: 'Техника департамента frontend/backend разработки',
  });
  await groupRepo.save([group1, group2]);

  // 3. Orders matching screenshots
  const order1 = orderRepo.create({
    title: 'Длинное предлинное длиннючее название прихода',
    description: 'Поставка партии мониторов Gigabyte и комплектующих',
    location: 'Центральный склад #1 (Киев)',
    latitude: 50.4501,
    longitude: 30.5234,
    createdBy: alexUser,
    createdAt: new Date('2017-04-06T12:09:33Z'),
  });

  const order2 = orderRepo.create({
    title: 'Длинное название прихода',
    description: 'Срочный приход периферии',
    location: 'Склад №2 (Львов)',
    latitude: 49.8397,
    longitude: 24.0297,
    createdBy: alexUser,
    createdAt: new Date('2017-09-06T12:09:33Z'),
  });

  const order3 = orderRepo.create({
    title: 'Длинное предлинное длиннючее название прихода',
    description: 'Плановая инвентаризация 2017',
    location: 'Склад №3 (Одесса)',
    latitude: 46.4825,
    longitude: 30.7233,
    createdBy: demoUser,
    createdAt: new Date('2017-06-06T12:09:33Z'),
  });

  const order4 = orderRepo.create({
    title: 'Длинное предлинное название прихода',
    description: 'Приход комплектующих материнских плат',
    location: 'Центральный склад #1 (Киев)',
    latitude: 50.4501,
    longitude: 30.5234,
    createdBy: alexUser,
    createdAt: new Date('2017-02-06T12:09:33Z'),
  });

  await orderRepo.save([order1, order2, order3, order4]);

  // 4. Products matching app.js and screenshots (25 products total)
  const productsToSave: ProductEntity[] = [];
  const pricesToSave: ProductPriceEntity[] = [];

  const photoUuid = '550e8400-e29b-41d4-a716-446655440000.png';

  for (let i = 1; i <= 25; i++) {
    const isEven = i % 2 === 0;
    const assignedOrder = i <= 6 ? order1 : i <= 12 ? order2 : i <= 18 ? order3 : order4;
    const assignedGrp = i % 3 === 0 ? group1 : i % 3 === 1 ? group2 : null;
    const assignedUsr = i % 4 === 0 ? alexUser : i % 4 === 1 ? demoUser : null;

    const prod = productRepo.create({
      serialNumber: 123456789 + i,
      condition: isEven ? ProductCondition.USED : ProductCondition.NEW,
      operationalStatus: isEven
        ? ProductOperationalStatus.IN_REPAIR
        : ProductOperationalStatus.AVAILABLE,
      photo: photoUuid,
      title: 'Gigabyte Technology X58-USB3 (Socket 1366) 6 X58-USB3',
      type: i % 5 === 0 ? 'Laptops' : 'Monitors',
      specification: 'Specification 1 (Rev 2.0 6-Core DDR3 Triple Channel)',
      guaranteeStart: new Date('2017-04-06T12:09:33Z'),
      guaranteeEnd: new Date('2025-08-06T12:09:33Z'),
      order: assignedOrder,
      orderId: assignedOrder.id,
      group: assignedGrp,
      groupId: assignedGrp ? assignedGrp.id : null,
      assignedUser: assignedUsr,
      assignedUserId: assignedUsr ? assignedUsr.id : null,
      createdAt: new Date('2017-06-29T12:09:33Z'),
    });

    productsToSave.push(prod);
  }

  const savedProducts = await productRepo.save(productsToSave);

  for (const prod of savedProducts) {
    const priceUsd = priceRepo.create({
      product: prod,
      productId: prod.id,
      value: 2500,
      currencyCode: CurrencyCode.USD,
      currencyRole: PriceCurrencyRole.VALUATION_REFERENCE,
    });
    const priceUah = priceRepo.create({
      product: prod,
      productId: prod.id,
      value: 250000.5,
      currencyCode: CurrencyCode.UAH,
      currencyRole: PriceCurrencyRole.PRIMARY_SETTLEMENT,
    });
    pricesToSave.push(priceUsd, priceUah);
  }

  await priceRepo.save(pricesToSave);

  console.log('Seed completed successfully!');
  if (createdLocal) await ds.destroy();
}

if (require.main === module) {
  runSeed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
