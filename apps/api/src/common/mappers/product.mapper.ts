import { ProductEntity } from '../../database/entities';
import { Product } from '@dzencode/contracts';

export class ProductMapper {
  static toDto(item: ProductEntity): Product {
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
