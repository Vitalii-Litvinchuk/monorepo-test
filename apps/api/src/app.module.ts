import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './database/database.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ProductsModule } from './modules/products/products.module';
import { GroupsModule } from './modules/groups/groups.module';
import { UsersModule } from './modules/users/users.module';
import { InventoryGraphqlModule } from './modules/inventory-graphql/inventory-graphql.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),
    DatabaseModule,
    SessionsModule,
    UploadsModule,
    AuthModule,
    OrdersModule,
    ProductsModule,
    GroupsModule,
    UsersModule,
    InventoryGraphqlModule,
  ],
})
export class AppModule {}
