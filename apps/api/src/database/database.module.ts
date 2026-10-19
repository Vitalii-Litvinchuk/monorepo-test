import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import * as fs from 'fs';
import {
  UserEntity,
  OrderEntity,
  GroupEntity,
  ProductEntity,
  ProductPriceEntity,
} from './entities';

// Find repository root where package.json and inventory.sqlite live
function getDatabasePath(): string {
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }
  // Traverse up to find directory containing root package.json with dzencode-inventory-monorepo
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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: getDatabasePath(),
      entities: [
        UserEntity,
        OrderEntity,
        GroupEntity,
        ProductEntity,
        ProductPriceEntity,
      ],
      synchronize: true, // auto-create schema on startup for SQLite
      logging: false,
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      OrderEntity,
      GroupEntity,
      ProductEntity,
      ProductPriceEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
