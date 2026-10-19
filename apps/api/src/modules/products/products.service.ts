import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ProductEntity,
  ProductPriceEntity,
  OrderEntity,
  GroupEntity,
  UserEntity,
} from '../../database/entities';
import { CreateProductDtoClass } from './dto/create-product.dto';
import { ProductFilterDtoClass } from './dto/product-filter.dto';
import { Product, WS_EVENTS } from '@dzencode/contracts';
import { SessionsGateway } from '../sessions/sessions.gateway';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(ProductPriceEntity)
    private readonly priceRepo: Repository<ProductPriceEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupRepo: Repository<GroupEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly eventEmitter: EventEmitter2,
    private readonly sessionsGateway: SessionsGateway,
  ) {}

  async findAll(filter?: ProductFilterDtoClass): Promise<Product[]> {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.prices', 'prices')
      .leftJoinAndSelect('product.order', 'order')
      .leftJoinAndSelect('product.group', 'group')
      .leftJoinAndSelect('product.assignedUser', 'assignedUser')
      .orderBy('product.createdAt', 'DESC');

    if (filter?.type && filter.type !== 'all' && filter.type !== '') {
      qb.andWhere('LOWER(product.type) = LOWER(:type)', { type: filter.type });
    }

    if (filter?.specification && filter.specification !== 'all' && filter.specification !== '') {
      qb.andWhere('LOWER(product.specification) LIKE LOWER(:spec)', {
        spec: `%${filter.specification}%`,
      });
    }

    if (filter?.condition) {
      qb.andWhere('product.condition = :condition', { condition: filter.condition });
    }

    if (filter?.operationalStatus) {
      qb.andWhere('product.operationalStatus = :status', { status: filter.operationalStatus });
    }

    if (filter?.orderId) {
      qb.andWhere('product.orderId = :orderId', { orderId: filter.orderId });
    }

    if (filter?.search && filter.search.trim() !== '') {
      const term = `%${filter.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(product.title) LIKE :term OR CAST(product.serialNumber AS TEXT) LIKE :term OR LOWER(product.specification) LIKE :term)',
        { term },
      );
    }

    const items = await qb.getMany();
    return items.map((item) => this.mapEntityToDto(item));
  }

  async findOne(id: string): Promise<Product> {
    const item = await this.productRepo.findOne({
      where: { id },
      relations: ['prices', 'order', 'group', 'assignedUser'],
    });

    if (!item) {
      throw new NotFoundException(`Продукт з ID ${id} не знайдено`);
    }

    return this.mapEntityToDto(item);
  }

  async create(dto: CreateProductDtoClass): Promise<Product> {
    const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
    if (!order) {
      throw new NotFoundException(`Приход з ID ${dto.orderId} не знайдено`);
    }

    let group: GroupEntity | null = null;
    if (dto.groupId) {
      group = await this.groupRepo.findOne({ where: { id: dto.groupId } });
    }

    let user: UserEntity | null = null;
    if (dto.assignedUserId) {
      user = await this.userRepo.findOne({ where: { id: dto.assignedUserId } });
    }

    const product = this.productRepo.create({
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

    const savedProduct = await this.productRepo.save(product);

    if (dto.prices && dto.prices.length > 0) {
      const prices = dto.prices.map((pr) =>
        this.priceRepo.create({
          product: savedProduct,
          productId: savedProduct.id,
          value: pr.value,
          currencyCode: pr.currencyCode,
          currencyRole: pr.currencyRole,
        }),
      );
      savedProduct.prices = await this.priceRepo.save(prices);
    }

    const result = this.mapEntityToDto(savedProduct);

    // EDA event & WS broadcast
    this.eventEmitter.emit(WS_EVENTS.PRODUCT_CREATED, result);
    this.sessionsGateway.broadcastEvent(WS_EVENTS.PRODUCT_CREATED, result);

    this.invalidateMetadataCache();
    return result;
  }

  async update(id: string, dto: any): Promise<Product> {
    const item = await this.productRepo.findOne({
      where: { id },
      relations: ['prices', 'order', 'group', 'assignedUser'],
    });

    if (!item) {
      throw new NotFoundException(`Продукт з ID ${id} не знайдено`);
    }

    if (dto.title !== undefined) item.title = dto.title;
    if (dto.serialNumber !== undefined) item.serialNumber = dto.serialNumber;
    if (dto.condition !== undefined) item.condition = dto.condition;
    if (dto.operationalStatus !== undefined) item.operationalStatus = dto.operationalStatus;
    if (dto.photo !== undefined) item.photo = dto.photo;
    if (dto.type !== undefined) item.type = dto.type;
    if (dto.specification !== undefined) item.specification = dto.specification;
    if (dto.guaranteeStart !== undefined) item.guaranteeStart = new Date(dto.guaranteeStart);
    if (dto.guaranteeEnd !== undefined) item.guaranteeEnd = new Date(dto.guaranteeEnd);

    if (dto.orderId && dto.orderId !== item.orderId) {
      const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
      if (order) {
        item.order = order;
        item.orderId = order.id;
      }
    }

    if (dto.groupId !== undefined) {
      if (dto.groupId) {
        const group = await this.groupRepo.findOne({ where: { id: dto.groupId } });
        item.group = group;
        item.groupId = group ? group.id : null;
      } else {
        item.group = null as any;
        item.groupId = null;
      }
    }

    if (dto.assignedUserId !== undefined) {
      if (dto.assignedUserId) {
        const user = await this.userRepo.findOne({ where: { id: dto.assignedUserId } });
        item.assignedUser = user;
        item.assignedUserId = user ? user.id : null;
      } else {
        item.assignedUser = null as any;
        item.assignedUserId = null;
      }
    }

    const saved = await this.productRepo.save(item);

    if (dto.prices && dto.prices.length > 0) {
      await this.priceRepo.delete({ productId: saved.id });
      const prices = dto.prices.map((pr: any) =>
        this.priceRepo.create({
          product: saved,
          productId: saved.id,
          value: pr.value,
          currencyCode: pr.currencyCode,
          currencyRole: pr.currencyRole,
        }),
      );
      saved.prices = await this.priceRepo.save(prices);
    }

    const result = this.mapEntityToDto(saved);
    this.eventEmitter.emit(WS_EVENTS.PRODUCT_UPDATED, result);
    this.sessionsGateway.broadcastEvent(WS_EVENTS.PRODUCT_UPDATED, result);

    this.invalidateMetadataCache();
    return result;
  }

  async remove(id: string): Promise<{ success: boolean; id: string }> {
    const item = await this.productRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Продукт з ID ${id} не знайдено`);
    }

    const orderId = item.orderId;
    await this.productRepo.remove(item);

    const payload = { productId: id, orderId, timestamp: new Date().toISOString() };
    this.eventEmitter.emit(WS_EVENTS.PRODUCT_DELETED, payload);
    this.sessionsGateway.broadcastEvent(WS_EVENTS.PRODUCT_DELETED, payload);

    this.invalidateMetadataCache();
    return { success: true, id };
  }

  private registeredTypes: Set<string> = new Set(['Laptops', 'Monitors', 'Smartphones', 'Tablets']);
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
    const result = await this.productRepo
      .createQueryBuilder('product')
      .select('DISTINCT(product.type)', 'type')
      .orderBy('product.type', 'ASC')
      .getRawMany();

    const dbTypes = result.map((r) => r.type).filter(Boolean);
    const combined = Array.from(new Set([...dbTypes, ...Array.from(this.registeredTypes)]));
    combined.sort((a, b) => a.localeCompare(b));
    this.cachedTypes = combined;
    return this.cachedTypes;
  }

  async getSpecifications(): Promise<string[]> {
    if (this.cachedSpecs) return this.cachedSpecs;
    const result = await this.productRepo
      .createQueryBuilder('product')
      .select('DISTINCT(product.specification)', 'specification')
      .orderBy('product.specification', 'ASC')
      .getRawMany();

    this.cachedSpecs = result.map((r) => r.specification).filter(Boolean);
    return this.cachedSpecs;
  }

  private mapEntityToDto(item: ProductEntity): Product {
    return {
      id: item.id,
      serialNumber: item.serialNumber,
      condition: item.condition,
      operationalStatus: item.operationalStatus,
      photo: item.photo,
      title: item.title,
      type: item.type,
      specification: item.specification,
      guarantee: {
        start: item.guaranteeStart ? item.guaranteeStart.toISOString() : '',
        end: item.guaranteeEnd ? item.guaranteeEnd.toISOString() : '',
      },
      prices: (item.prices || []).map((pr) => ({
        id: pr.id,
        productId: pr.productId,
        value: pr.value,
        currencyCode: pr.currencyCode,
        currencyRole: pr.currencyRole,
      })),
      orderId: item.orderId,
      orderTitle: item.order?.title || undefined,
      groupId: item.groupId,
      groupTitle: item.group?.title || null,
      assignedUserId: item.assignedUserId,
      assignedUserName: item.assignedUser?.fullName || null,
      createdAt: item.createdAt ? item.createdAt.toISOString() : '',
    };
  }
}
