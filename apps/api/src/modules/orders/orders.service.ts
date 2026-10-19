import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderEntity, UserEntity } from '../../database/entities';
import { CreateOrderDtoClass } from './dto/create-order.dto';
import {
  CurrencyCode,
  Order,
  PriceCurrencyRole,
  WS_EVENTS,
} from '@dzencode/contracts';
import { SessionsGateway } from '../sessions/sessions.gateway';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    private readonly eventEmitter: EventEmitter2,
    private readonly sessionsGateway: SessionsGateway,
  ) {}

  async findAll(): Promise<Order[]> {
    const orders = await this.orderRepo.find({
      relations: [
        'products',
        'products.prices',
        'products.group',
        'products.assignedUser',
      ],
      order: { createdAt: 'DESC' },
    });

    return orders.map((order) => this.mapOrderEntityToDto(order));
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: [
        'products',
        'products.prices',
        'products.group',
        'products.assignedUser',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Приход з ID ${id} не знайдено`);
    }

    return this.mapOrderEntityToDto(order);
  }

  async create(dto: CreateOrderDtoClass, user?: UserEntity): Promise<Order> {
    const order = this.orderRepo.create({
      title: dto.title,
      description: dto.description || '',
      location: dto.location || 'Центральний склад #1 (Київ)',
      latitude: dto.latitude || 50.4501,
      longitude: dto.longitude || 30.5234,
      createdBy: user || null,
      products: [],
    });

    const saved = await this.orderRepo.save(order);
    const result = this.mapOrderEntityToDto(saved);

    // Event-Driven Architecture (EDA) & WS broadcast
    this.eventEmitter.emit(WS_EVENTS.ORDER_CREATED, result);
    this.sessionsGateway.broadcastEvent(WS_EVENTS.ORDER_CREATED, result);

    return result;
  }

  async update(id: string, dto: { title?: string; description?: string; location?: string; latitude?: number; longitude?: number }): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: [
        'products',
        'products.prices',
        'products.group',
        'products.assignedUser',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Приход з ID ${id} не знайдено`);
    }

    if (dto.title !== undefined) order.title = dto.title;
    if (dto.description !== undefined) order.description = dto.description;
    if (dto.location !== undefined) order.location = dto.location;
    if (dto.latitude !== undefined) order.latitude = dto.latitude;
    if (dto.longitude !== undefined) order.longitude = dto.longitude;

    const saved = await this.orderRepo.save(order);
    const result = this.mapOrderEntityToDto(saved);

    this.eventEmitter.emit(WS_EVENTS.ORDER_UPDATED, result);
    this.sessionsGateway.broadcastEvent(WS_EVENTS.ORDER_UPDATED, result);

    return result;
  }

  async remove(id: string): Promise<{ success: boolean; id: string }> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Приход з ID ${id} не знайдено`);
    }

    await this.orderRepo.remove(order);

    const payload = { orderId: id, timestamp: new Date().toISOString() };
    this.eventEmitter.emit(WS_EVENTS.ORDER_DELETED, payload);
    this.sessionsGateway.broadcastEvent(WS_EVENTS.ORDER_DELETED, payload);

    return { success: true, id };
  }

  private mapOrderEntityToDto(entity: OrderEntity): Order {
    const products = entity.products || [];
    const productsCount = products.length;

    // Calculate aggregated prices in 2 currencies (UAH & USD)
    let totalUah = 0;
    let totalUsd = 0;

    for (const prod of products) {
      if (prod.prices) {
        for (const p of prod.prices) {
          if (p.currencyCode === CurrencyCode.UAH) {
            totalUah += p.value;
          } else if (p.currencyCode === CurrencyCode.USD) {
            totalUsd += p.value;
          }
        }
      }
    }

    const mappedProducts = products.map((prod) => ({
      id: prod.id,
      serialNumber: prod.serialNumber,
      condition: prod.condition,
      operationalStatus: prod.operationalStatus,
      photo: prod.photo,
      title: prod.title,
      type: prod.type,
      specification: prod.specification,
      guarantee: {
        start: prod.guaranteeStart ? prod.guaranteeStart.toISOString() : '',
        end: prod.guaranteeEnd ? prod.guaranteeEnd.toISOString() : '',
      },
      prices: (prod.prices || []).map((pr) => ({
        id: pr.id,
        productId: pr.productId,
        value: pr.value,
        currencyCode: pr.currencyCode,
        currencyRole: pr.currencyRole,
      })),
      orderId: prod.orderId,
      orderTitle: entity.title,
      groupId: prod.groupId,
      groupTitle: prod.group?.title || null,
      assignedUserId: prod.assignedUserId,
      assignedUserName: prod.assignedUser?.fullName || null,
      createdAt: prod.createdAt ? prod.createdAt.toISOString() : '',
    }));

    return {
      id: entity.id,
      title: entity.title,
      description: entity.description || '',
      location: entity.location,
      latitude: entity.latitude,
      longitude: entity.longitude,
      createdAt: entity.createdAt.toISOString(),
      productsCount,
      products: mappedProducts,
      totalPrices: [
        {
          value: totalUsd,
          currencyCode: CurrencyCode.USD,
          currencyRole: PriceCurrencyRole.VALUATION_REFERENCE,
        },
        {
          value: totalUah,
          currencyCode: CurrencyCode.UAH,
          currencyRole: PriceCurrencyRole.PRIMARY_SETTLEMENT,
        },
      ],
    };
  }
}
