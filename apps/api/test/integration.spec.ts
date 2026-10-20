import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import {
  OrderEntity,
  ProductEntity,
  ProductPriceEntity,
  GroupEntity,
  UserEntity,
} from '../src/database/entities';
import { GenericRepository } from '../src/database/repositories';
import { OrdersController } from '../src/modules/orders/orders.controller';
import { OrdersService } from '../src/modules/orders/orders.service';
import { ProductsController } from '../src/modules/products/products.controller';
import { ProductsService } from '../src/modules/products/products.service';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { SessionsGateway } from '../src/modules/sessions/sessions.gateway';
import { createPipelineValidationPipe } from '../src/common/pipes/validation.pipe';
import { CreateOrderDtoClass } from '../src/modules/orders/dto/create-order.dto';
import { CreateProductDtoClass } from '../src/modules/products/dto/create-product.dto';
import {
  CurrencyCode,
  PriceCurrencyRole,
  ProductCondition,
  ProductOperationalStatus,
  UserRole,
} from '@dzencode/contracts';
import { BadRequestException } from '@nestjs/common';

describe('Fullstack API Integration Tests (Controllers, Services & SQLite DB)', () => {
  let dataSource: DataSource;
  let ordersController: OrdersController;
  let ordersService: OrdersService;
  let productsController: ProductsController;
  let productsService: ProductsService;
  let authController: AuthController;
  let authService: AuthService;
  let jwtService: JwtService;
  let eventEmitter: EventEmitter2;
  let sessionsGateway: SessionsGateway;

  beforeAll(async () => {
    // 1. Initialize real in-memory SQLite database
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [
        OrderEntity,
        ProductEntity,
        ProductPriceEntity,
        GroupEntity,
        UserEntity,
      ],
      synchronize: true,
      logging: false,
    });
    await dataSource.initialize();

    // 2. Setup real Services & Dependencies
    eventEmitter = new EventEmitter2({ wildcard: true });
    sessionsGateway = new SessionsGateway();
    // Mock socket.io server instance on gateway
    (sessionsGateway as any).server = {
      emit: jest.fn(),
    };

    jwtService = new JwtService({
      secret: 'test-integration-jwt-secret-2026',
      signOptions: { expiresIn: '1h' },
    });

    const orderRepo = new GenericRepository(dataSource.getRepository(OrderEntity), dataSource);
    const productRepo = new GenericRepository(dataSource.getRepository(ProductEntity), dataSource);
    const groupRepo = new GenericRepository(dataSource.getRepository(GroupEntity), dataSource);
    const userRepo = new GenericRepository(dataSource.getRepository(UserEntity), dataSource);

    ordersService = new OrdersService(orderRepo, eventEmitter, sessionsGateway);
    ordersController = new OrdersController(ordersService);

    productsService = new ProductsService(
      productRepo,
      orderRepo,
      groupRepo,
      userRepo,
      eventEmitter,
      sessionsGateway,
    );
    productsController = new ProductsController(productsService);

    authService = new AuthService(userRepo, jwtService);
    authController = new AuthController(authService);
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('1. Orders & Products Lifecycle & Dual-Currency Integration', () => {
    let createdOrderId: string;
    let createdProductId1: string;
    let createdProductId2: string;

    it('should create a new Order in the database', async () => {
      const orderDto = new CreateOrderDtoClass();
      orderDto.title = 'Order Integration Test #1';
      orderDto.description = 'Testing full DB write and relations';
      orderDto.location = 'Kyiv Hub';

      const order = await ordersController.create(orderDto);
      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.title).toBe('Order Integration Test #1');
      expect(order.productsCount).toBe(0);
      expect(order.totalPrices).toEqual([
        { value: 0, currencyCode: CurrencyCode.USD, currencyRole: PriceCurrencyRole.VALUATION_REFERENCE },
        { value: 0, currencyCode: CurrencyCode.UAH, currencyRole: PriceCurrencyRole.PRIMARY_SETTLEMENT },
      ]);

      createdOrderId = order.id;
    });

    it('should attach multiple Products with prices to the created Order', async () => {
      // Product 1
      const prodDto1 = new CreateProductDtoClass();
      prodDto1.orderId = createdOrderId;
      prodDto1.serialNumber = 5001;
      prodDto1.title = 'Dell UltraSharp 27"';
      prodDto1.type = 'Monitors';
      prodDto1.specification = '4K IPS';
      prodDto1.condition = ProductCondition.NEW;
      prodDto1.operationalStatus = ProductOperationalStatus.AVAILABLE;
      prodDto1.guaranteeStart = '2026-01-01';
      prodDto1.guaranteeEnd = '2027-01-01';
      prodDto1.prices = [
        {
          value: 400,
          currencyCode: CurrencyCode.USD,
          currencyRole: PriceCurrencyRole.VALUATION_REFERENCE,
        },
        {
          value: 16400,
          currencyCode: CurrencyCode.UAH,
          currencyRole: PriceCurrencyRole.PRIMARY_SETTLEMENT,
        },
      ];

      const p1 = await productsController.create(prodDto1);
      expect(p1.id).toBeDefined();
      expect(p1.orderId).toBe(createdOrderId);
      createdProductId1 = p1.id;

      // Product 2
      const prodDto2 = new CreateProductDtoClass();
      prodDto2.orderId = createdOrderId;
      prodDto2.serialNumber = 5002;
      prodDto2.title = 'Apple MacBook Pro M3';
      prodDto2.type = 'Laptops';
      prodDto2.specification = '16GB 512GB';
      prodDto2.condition = ProductCondition.NEW;
      prodDto2.operationalStatus = ProductOperationalStatus.AVAILABLE;
      prodDto2.guaranteeStart = '2026-01-01';
      prodDto2.guaranteeEnd = '2028-01-01';
      prodDto2.prices = [
        {
          value: 2000,
          currencyCode: CurrencyCode.USD,
          currencyRole: PriceCurrencyRole.VALUATION_REFERENCE,
        },
        {
          value: 82000,
          currencyCode: CurrencyCode.UAH,
          currencyRole: PriceCurrencyRole.PRIMARY_SETTLEMENT,
        },
      ];

      const p2 = await productsController.create(prodDto2);
      expect(p2.id).toBeDefined();
      createdProductId2 = p2.id;
    });

    it('should aggregate dual-currency totals correctly in Order after adding products', async () => {
      const order = await ordersController.findOne(createdOrderId);
      expect(order.productsCount).toBe(2);
      expect(order.products).toHaveLength(2);

      const usdTotal = order.totalPrices.find((p) => p.currencyCode === CurrencyCode.USD)?.value;
      const uahTotal = order.totalPrices.find((p) => p.currencyCode === CurrencyCode.UAH)?.value;

      // 400 + 2000 = 2400 USD
      expect(usdTotal).toBe(2400);
      // 16400 + 82000 = 98400 UAH
      expect(uahTotal).toBe(98400);
    });

    it('should support dynamic product types addition and listing', async () => {
      const initialTypes = await productsController.getTypes();
      expect(Array.isArray(initialTypes)).toBe(true);

      const updatedTypes = await productsController.createType('Keyboards');
      expect(Array.isArray(updatedTypes)).toBe(true);
      expect(updatedTypes).toContain('Keyboards');

      const reFetchedTypes = await productsController.getTypes();
      expect(reFetchedTypes).toContain('Keyboards');
    });

    it('should support dynamic product specifications addition and listing', async () => {
      const initialSpecs = await productsController.getSpecifications();
      expect(Array.isArray(initialSpecs)).toBe(true);

      const updatedSpecs = await productsController.createSpecification('UltraWide OLED 240Hz');
      expect(Array.isArray(updatedSpecs)).toBe(true);
      expect(updatedSpecs).toContain('UltraWide OLED 240Hz');

      const reFetchedSpecs = await productsController.getSpecifications();
      expect(reFetchedSpecs).toContain('UltraWide OLED 240Hz');
    });

    it('should support search and exact case-insensitive specification filtering on Products', async () => {
      const allMonitors = await productsController.findAll({ type: 'Monitors' } as any);
      expect(allMonitors.some((p) => p.id === createdProductId1)).toBe(true);
      expect(allMonitors.some((p) => p.id === createdProductId2)).toBe(false);

      // Exact case-insensitive specification filter with whitespace trimming
      const filteredBySpec = await productsController.findAll({
        specification: '  16gb 512gb  ',
      } as any);
      expect(filteredBySpec.some((p) => p.id === createdProductId2)).toBe(true);
      expect(filteredBySpec.some((p) => p.id === createdProductId1)).toBe(false);

      const searchMac = await productsController.findAll({ search: 'MacBook' } as any);
      expect(searchMac.some((p) => p.id === createdProductId2)).toBe(true);
      expect(searchMac.some((p) => p.id === createdProductId1)).toBe(false);
    });

    it('should cascade delete products and prices when the order is removed', async () => {
      const deleteResult = await ordersController.remove(createdOrderId);
      expect(deleteResult.success).toBe(true);

      // Verify order is gone
      await expect(ordersController.findOne(createdOrderId)).rejects.toThrow();

      // Verify child products are cascaded in SQLite
      await expect(productsController.findOne(createdProductId1)).rejects.toThrow();
      await expect(productsController.findOne(createdProductId2)).rejects.toThrow();
    });
  });

  describe('2. Authentication & JWT Bearer Integration', () => {
    it('should authenticate user in demo-login and return valid JWT with user payload', async () => {
      const authRes = await authController.demoLogin('tester@dzencode.com');
      expect(authRes.accessToken).toBeDefined();
      expect(authRes.user).toBeDefined();
      expect(authRes.user.email).toBe('tester@dzencode.com');
      expect(authRes.user.role).toBe(UserRole.MANAGER);

      // Verify JWT payload directly
      const decoded: any = jwtService.verify(authRes.accessToken);
      expect(decoded.sub).toBe(authRes.user.id);
      expect(decoded.email).toBe('tester@dzencode.com');
      expect(decoded.role).toBe(UserRole.MANAGER);
    });

    it('should persist and retrieve user profile via validateOrCreateGoogleUser', async () => {
      const googleUser = await authService.validateOrCreateGoogleUser({
        googleId: 'google-oauth-unique-id-999',
        email: 'google.engineer@gmail.com',
        fullName: 'Alex Google',
        avatarUrl: '/static/avatar.png',
      });

      expect(googleUser.id).toBeDefined();
      expect(googleUser.googleId).toBe('google-oauth-unique-id-999');
      expect(googleUser.fullName).toBe('Alex Google');

      // Calling again with same googleId should return existing record without duplicating
      const existing = await authService.validateOrCreateGoogleUser({
        googleId: 'google-oauth-unique-id-999',
        email: 'google.engineer@gmail.com',
        fullName: 'Alex Google Updated',
        avatarUrl: '/static/avatar.png',
      });

      expect(existing.id).toBe(googleUser.id);
    });
  });

  describe('3. Pipeline ValidationPipe (C# style RFC 7807) Integration', () => {
    const pipe = createPipelineValidationPipe();

    it('should reject invalid CreateOrderDto before entering handler with 400 ProblemDetails', async () => {
      const invalid = new CreateOrderDtoClass();
      invalid.title = 'A'; // Below min length 3

      try {
        await pipe.transform(invalid, {
          type: 'body',
          metatype: CreateOrderDtoClass,
        });
        fail('Should throw BadRequestException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = err.getResponse();
        expect(res.statusCode).toBe(400);
        expect(res.errors).toBeDefined();
        expect(res.errors.title).toBeDefined();
      }
    });

    it('should reject invalid CreateProductDto with multiple field validation errors', async () => {
      const invalidProd = new CreateProductDtoClass();
      // Missing orderId, missing title, missing serialNumber

      try {
        await pipe.transform(invalidProd, {
          type: 'body',
          metatype: CreateProductDtoClass,
        });
        fail('Should throw BadRequestException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = err.getResponse();
        expect(res.statusCode).toBe(400);
        expect(res.errors.title).toBeDefined();
        expect(res.errors.orderId).toBeDefined();
      }
    });
  });

  describe('4. WebSocket Sessions Gateway Integration', () => {
    it('should track active socket connections and broadcast count', () => {
      const mockSocket1 = { id: 'socket-tab-1' } as any;
      const mockSocket2 = { id: 'socket-tab-2' } as any;

      sessionsGateway.handleConnection(mockSocket1);
      expect(sessionsGateway.getActiveCount()).toBe(1);

      sessionsGateway.handleConnection(mockSocket2);
      expect(sessionsGateway.getActiveCount()).toBe(2);

      sessionsGateway.handleDisconnect(mockSocket1);
      expect(sessionsGateway.getActiveCount()).toBe(1);

      sessionsGateway.handleDisconnect(mockSocket2);
      expect(sessionsGateway.getActiveCount()).toBe(0);
    });
  });
});
