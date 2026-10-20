import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderEntity, UserEntity } from '../../database/entities';
import {
  GenericRepository,
  InjectGenericRepository,
} from '../../database/repositories';
import { CreateOrderDtoClass } from './dto/create-order.dto';
import { Order, WS_EVENTS } from '@dzencode/contracts';
import { SessionsGateway } from '../sessions/sessions.gateway';
import { OrderMapper } from '../../common/mappers';

@Injectable()
export class OrdersService {
  constructor(
    @InjectGenericRepository(OrderEntity)
    private readonly orderRepo: GenericRepository<OrderEntity>,
    private readonly eventEmitter: EventEmitter2,
    private readonly sessionsGateway: SessionsGateway,
  ) {}

  private readonly defaultRelations = [
    'products',
    'products.prices',
    'products.group',
    'products.assignedUser',
  ];

  // CQRS Query: Get All Orders
  async findAll(): Promise<Order[]> {
    const orders = await this.orderRepo.findAll({
      relations: this.defaultRelations,
      orderBy: { createdAt: 'DESC' },
    });

    return orders.map(OrderMapper.toDto);
  }

  // CQRS Query: Get Single Order
  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepo.findOneById(id, this.defaultRelations);
    if (!order) {
      throw new NotFoundException(`Приход з ID ${id} не знайдено`);
    }

    return OrderMapper.toDto(order);
  }

  // CQRS Command: Create Order
  async create(dto: CreateOrderDtoClass, user?: UserEntity): Promise<Order> {
    const order = await this.orderRepo.create({
      title: dto.title,
      description: dto.description || '',
      location: dto.location || 'Центральний склад #1 (Київ)',
      latitude: dto.latitude || 50.4501,
      longitude: dto.longitude || 30.5234,
      createdBy: user || null,
      products: [],
    });

    const result = OrderMapper.toDto(order);

    // Event-Driven Architecture (EDA) & WS broadcast
    this.eventEmitter.emit(WS_EVENTS.ORDER_CREATED, result);
    this.sessionsGateway.broadcastEvent(WS_EVENTS.ORDER_CREATED, result);

    return result;
  }

  // CQRS Command: Update Order
  async update(
    id: string,
    dto: {
      title?: string;
      description?: string;
      location?: string;
      latitude?: number;
      longitude?: number;
    },
  ): Promise<Order> {
    const existing = await this.orderRepo.findOneById(id);
    if (!existing) {
      throw new NotFoundException(`Приход з ID ${id} не знайдено`);
    }

    const updated = await this.orderRepo.update(id, dto, this.defaultRelations);
    if (!updated) {
      throw new NotFoundException(`Приход з ID ${id} не знайдено`);
    }

    const result = OrderMapper.toDto(updated);

    this.eventEmitter.emit(WS_EVENTS.ORDER_UPDATED, result);
    this.sessionsGateway.broadcastEvent(WS_EVENTS.ORDER_UPDATED, result);

    return result;
  }

  // CQRS Command: Remove Order
  async remove(id: string): Promise<{ success: boolean; id: string }> {
    const existing = await this.orderRepo.findOneById(id);
    if (!existing) {
      throw new NotFoundException(`Приход з ID ${id} не знайдено`);
    }

    await this.orderRepo.delete(id);

    const payload = { orderId: id, timestamp: new Date().toISOString() };
    this.eventEmitter.emit(WS_EVENTS.ORDER_DELETED, payload);
    this.sessionsGateway.broadcastEvent(WS_EVENTS.ORDER_DELETED, payload);

    return { success: true, id };
  }
}
