import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ProductEntity,
  ProductPriceEntity,
  OrderEntity,
  GroupEntity,
  UserEntity,
} from '../../database/entities';
import {
  GenericRepository,
  InjectGenericRepository,
} from '../../database/repositories';
import { CreateProductDtoClass } from './dto/create-product.dto';
import { UpdateProductDtoClass } from './dto/update-product.dto';
import { ProductFilterDtoClass } from './dto/product-filter.dto';
import { Product, WS_EVENTS } from '@dzencode/contracts';
import { SessionsGateway } from '../sessions/sessions.gateway';
import { ProductMapper } from '../../common/mappers';

@Injectable()
export class ProductsService {
  constructor(
    @InjectGenericRepository(ProductEntity)
    private readonly productRepo: GenericRepository<ProductEntity>,
    @InjectGenericRepository(OrderEntity)
    private readonly orderRepo: GenericRepository<OrderEntity>,
    @InjectGenericRepository(GroupEntity)
    private readonly groupRepo: GenericRepository<GroupEntity>,
    @InjectGenericRepository(UserEntity)
    private readonly userRepo: GenericRepository<UserEntity>,
    private readonly eventEmitter: EventEmitter2,
    private readonly sessionsGateway: SessionsGateway,
  ) {}

  private readonly defaultRelations = ['prices', 'order', 'group', 'assignedUser'];

  // CQRS Query: Find All Products with declarative criteria
  async findAll(filter?: ProductFilterDtoClass): Promise<Product[]> {
    const products = await this.productRepo.findAll({
      where: {
        type: filter?.type,
        specification: filter?.specification,
        condition: filter?.condition,
        operationalStatus: filter?.operationalStatus,
        orderId: filter?.orderId,
      },
      search: filter?.search
        ? {
            term: filter.search,
            fields: ['title', 'serialNumber', 'specification'],
          }
        : undefined,
      relations: this.defaultRelations,
      orderBy: { createdAt: 'DESC' },
    });

    return products.map(ProductMapper.toDto);
  }

  // CQRS Query: Find One Product
  async findOne(id: string): Promise<Product> {
    const item = await this.productRepo.findOneById(id, this.defaultRelations);
    if (!item) {
      throw new NotFoundException(`Продукт з ID ${id} не знайдено`);
    }

    return ProductMapper.toDto(item);
  }

  // CQRS Command: Create Product in ACID transaction
  async create(dto: CreateProductDtoClass): Promise<Product> {
    const order = await this.orderRepo.findOneById(dto.orderId);
    if (!order) {
      throw new NotFoundException(`Приход з ID ${dto.orderId} не знайдено`);
    }

    let group: GroupEntity | null = null;
    if (dto.groupId) {
      group = await this.groupRepo.findOneById(dto.groupId);
    }

    let user: UserEntity | null = null;
    if (dto.assignedUserId) {
      user = await this.userRepo.findOneById(dto.assignedUserId);
    }

    const savedProduct = await this.productRepo.executeInTransaction(async (manager) => {
      const prodRepo = manager.getRepository(ProductEntity);
      const prRepo = manager.getRepository(ProductPriceEntity);

      const product = prodRepo.create({
        serialNumber: dto.serialNumber,
        condition: dto.condition,
        operationalStatus: dto.operationalStatus,
        photo: dto.photo || '550e8400-e29b-41d4-a716-446655440000.png',
        title: dto.title,
        type: dto.type,
        specification: dto.specification,
        guaranteeStart: new Date(dto.guaranteeStart),
        guaranteeEnd: new Date(dto.guaranteeEnd),
        order,
        orderId: order.id,
        group,
        groupId: group ? group.id : null,
        assignedUser: user,
        assignedUserId: user ? user.id : null,
      });

      const saved = await prodRepo.save(product);

      if (dto.prices && dto.prices.length > 0) {
        const prices = dto.prices.map((pr) =>
          prRepo.create({
            product: saved,
            productId: saved.id,
            value: pr.value,
            currencyCode: pr.currencyCode,
            currencyRole: pr.currencyRole,
          }),
        );
        saved.prices = await prRepo.save(prices);
      } else {
        saved.prices = [];
      }

      return saved;
    });

    const result = ProductMapper.toDto(savedProduct);

    // EDA event & WS broadcast
    this.eventEmitter.emit(WS_EVENTS.PRODUCT_CREATED, result);
    this.sessionsGateway.broadcastEvent(WS_EVENTS.PRODUCT_CREATED, result);

    this.invalidateMetadataCache();
    return result;
  }

  // CQRS Command: Update Product in ACID transaction
  async update(id: string, dto: UpdateProductDtoClass | any): Promise<Product> {
    const existing = await this.productRepo.findOneById(id, this.defaultRelations);
    if (!existing) {
      throw new NotFoundException(`Продукт з ID ${id} не знайдено`);
    }

    let order = existing.order;
    if (dto.orderId && dto.orderId !== existing.orderId) {
      const newOrder = await this.orderRepo.findOneById(dto.orderId);
      if (newOrder) {
        order = newOrder;
        existing.orderId = newOrder.id;
      }
    }

    let group = existing.group;
    if (dto.groupId !== undefined) {
      if (dto.groupId) {
        const newGroup = await this.groupRepo.findOneById(dto.groupId);
        group = newGroup;
        existing.groupId = newGroup ? newGroup.id : null;
      } else {
        group = null;
        existing.groupId = null;
      }
    }

    let user = existing.assignedUser;
    if (dto.assignedUserId !== undefined) {
      if (dto.assignedUserId) {
        const newUser = await this.userRepo.findOneById(dto.assignedUserId);
        user = newUser;
        existing.assignedUserId = newUser ? newUser.id : null;
      } else {
        user = null;
        existing.assignedUserId = null;
      }
    }

    const updatedProduct = await this.productRepo.executeInTransaction(async (manager) => {
      const prodRepo = manager.getRepository(ProductEntity);
      const prRepo = manager.getRepository(ProductPriceEntity);

      if (dto.title !== undefined) existing.title = dto.title;
      if (dto.serialNumber !== undefined) existing.serialNumber = dto.serialNumber;
      if (dto.condition !== undefined) existing.condition = dto.condition;
      if (dto.operationalStatus !== undefined) existing.operationalStatus = dto.operationalStatus;
      if (dto.photo !== undefined) existing.photo = dto.photo;
      if (dto.type !== undefined) existing.type = dto.type;
      if (dto.specification !== undefined) existing.specification = dto.specification;
      if (dto.guaranteeStart !== undefined) existing.guaranteeStart = new Date(dto.guaranteeStart);
      if (dto.guaranteeEnd !== undefined) existing.guaranteeEnd = new Date(dto.guaranteeEnd);
      existing.order = order;
      existing.group = group;
      existing.assignedUser = user;

      const saved = await prodRepo.save(existing);

      if (dto.prices && dto.prices.length > 0) {
        await prRepo.delete({ productId: saved.id });
        const prices = dto.prices.map((pr: any) =>
          prRepo.create({
            product: saved,
            productId: saved.id,
            value: pr.value,
            currencyCode: pr.currencyCode,
            currencyRole: pr.currencyRole,
          }),
        );
        saved.prices = await prRepo.save(prices);
      }

      return saved;
    });

    const result = ProductMapper.toDto(updatedProduct);
    this.eventEmitter.emit(WS_EVENTS.PRODUCT_UPDATED, result);
    this.sessionsGateway.broadcastEvent(WS_EVENTS.PRODUCT_UPDATED, result);

    this.invalidateMetadataCache();
    return result;
  }

  // CQRS Command: Remove Product
  async remove(id: string): Promise<{ success: boolean; id: string }> {
    const item = await this.productRepo.findOneById(id);
    if (!item) {
      throw new NotFoundException(`Продукт з ID ${id} не знайдено`);
    }

    const orderId = item.orderId;
    await this.productRepo.delete(id);

    const payload = { productId: id, orderId, timestamp: new Date().toISOString() };
    this.eventEmitter.emit(WS_EVENTS.PRODUCT_DELETED, payload);
    this.sessionsGateway.broadcastEvent(WS_EVENTS.PRODUCT_DELETED, payload);

    this.invalidateMetadataCache();
    return { success: true, id };
  }

  // Metadata Cache & Registries
  private registeredTypes: Set<string> = new Set(['Laptops', 'Monitors', 'Smartphones', 'Tablets']);
  private registeredSpecs: Set<string> = new Set([
    'Specification 1',
    'IPS 4K 144Hz DisplayPort',
    'Apple M3 Max 16-Core 64GB',
    'Rev 2.0 6-Core DDR3 Triple Channel',
    'AMOLED 120Hz 512GB',
    'Mechanical RGB Cherry MX',
  ]);

  private cachedTypes: string[] | null = null;
  private cachedSpecs: string[] | null = null;

  private invalidateMetadataCache() {
    this.cachedTypes = null;
    this.cachedSpecs = null;
  }

  async addType(type: string): Promise<string[]> {
    const clean = type.trim();
    if (clean) {
      this.registeredTypes.add(clean);
      this.invalidateMetadataCache();
    }
    return this.getTypes();
  }

  async getTypes(): Promise<string[]> {
    if (this.cachedTypes) return this.cachedTypes;
    const dbTypes = await this.productRepo.distinct('type');
    const combined = Array.from(new Set([...dbTypes, ...Array.from(this.registeredTypes)]));
    combined.sort((a, b) => a.localeCompare(b));
    this.cachedTypes = combined;
    return this.cachedTypes;
  }

  async addSpecification(specification: string): Promise<string[]> {
    const clean = specification.trim();
    if (clean) {
      this.registeredSpecs.add(clean);
      this.invalidateMetadataCache();
    }
    return this.getSpecifications();
  }

  async getSpecifications(): Promise<string[]> {
    if (this.cachedSpecs) return this.cachedSpecs;
    const dbSpecs = await this.productRepo.distinct('specification');
    const combined = Array.from(new Set([...dbSpecs, ...Array.from(this.registeredSpecs)]));
    combined.sort((a, b) => a.localeCompare(b));
    this.cachedSpecs = combined;
    return this.cachedSpecs;
  }
}
