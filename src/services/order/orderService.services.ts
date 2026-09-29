import { randomUUID } from 'crypto';
import { EntityManager } from 'typeorm';

import { BaseServices } from '../baseService.services';

import Database from '../../database/database';

import {
  TAX_RATE,
  SHIPPING_AMOUNT,
} from '../../config';

import {
  OrderModel,
  OrderItemModel,
} from '../../database/repository/order/order.model';

import {
  CheckoutOrderDto,
} from '../../database/repository/order/order.dto';

import {
  OrderEntity,
  OrderStatus,
} from '../../entities/orderEntity';

import { OrderItemEntity } from '../../entities/orderItemEntity';
import { AuditLogEntity } from '../../entities/auditLogEntity';

import { CartEntity } from '../../entities/cartEntity';
import { CartItemEntity } from '../../entities/cartItemEntity';

import { AddressEntity } from '../../entities/addressEntity';

import { ProductEntity } from '../../entities/productEntity';

import {
  CouponEntity,
  CouponType,
} from '../../entities/couponEntity';

import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../core/ApiError';

class OrderService extends BaseServices<
  OrderModel,
  CheckoutOrderDto
> {
  private database =
    Database.getInstance();

  public getModel(): OrderModel {
    return new OrderModel();
  }

  public getDTO(): new () => CheckoutOrderDto {
    return CheckoutOrderDto;
  }

  public getModuleName(): string {
    return 'Order';
  }

  public async getOrdersForUser(
    userId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedOrdersResponse> {
    const skip = (page - 1) * limit;

    const [orders, total] =
      await OrderEntity.findAndCount({
        where: {
          user_id: userId,
          is_delete: 0,
        },
        order: {
          id: 'DESC',
        },
        skip,
        take: limit,
      });

    const items = await Promise.all(
      orders.map(
        (order) =>
          this.toModel(order)
      )
    );

    return {
      orders: items,
      page,
      limit,
      total,
      totalPages:
        total === 0
          ? 0
          : Math.ceil(total / limit),
    };
  }

  public async getAllOrders(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedOrdersResponse> {
    const skip = (page - 1) * limit;

    const [orders, total] =
      await OrderEntity.findAndCount({
        where: {
          is_delete: 0,
        },
        order: {
          id: 'DESC',
        },
        skip,
        take: limit,
      });

    const items = await Promise.all(
      orders.map(
        (order) =>
          this.toModel(order)
      )
    );

    return {
      orders: items,
      page,
      limit,
      total,
      totalPages:
        total === 0
          ? 0
          : Math.ceil(total / limit),
    };
  }

  public async getOrderById(
    orderId: number
  ): Promise<OrderModel> {
    const order =
      await OrderEntity.findOne({
        where: {
          id: orderId,
          is_delete: 0,
        },
      });

    if (!order) {
      throw new NotFoundError(
        'Order not found'
      );
    }

    return this.toModel(order);
  }

  public async getOrderByIdForUser(
    userId: number,
    orderId: number
  ): Promise<OrderModel> {
    const order =
      await OrderEntity.findOne({
        where: {
          id: orderId,
          is_delete: 0,
        },
      });

    if (!order) {
      throw new NotFoundError(
        'Order not found'
      );
    }

    if (order.user_id !== userId) {
      throw new ForbiddenError(
        'You do not have permission to access this order'
      );
    }

    return this.toModel(order);
  }

  // NEW: ADMIN / OPERATIONS order status update
  public async updateOrderStatus(
    orderId: number,
    newStatus: OrderStatus,
    userId?: number
  ): Promise<OrderModel> {
    const updatedOrderId =
      await this.database.runInTransaction(
        async (
          manager: EntityManager
        ): Promise<number> => {
          const order =
            await manager
              .getRepository(OrderEntity)
              .createQueryBuilder('order')
              .setLock(
                'pessimistic_write'
              )
              .where(
                'order.id = :orderId',
                {
                  orderId,
                }
              )
              .andWhere(
                'order.is_delete = :isDelete',
                {
                  isDelete: 0,
                }
              )
              .getOne();

          if (!order) {
            throw new NotFoundError(
              'Order not found'
            );
          }

          const previousStatus = order.status;

          this.validateStatusTransition(
            order.status,
            newStatus
          );

          order.status =
            newStatus;

          await manager.save(
            OrderEntity,
            order
          );

          const auditLog = manager.create(AuditLogEntity, {
            user_id: userId ?? null,
            action: 'ORDER_STATUS_CHANGED',
            entity_type: 'ORDER',
            entity_id: String(order.id),
            metadata: {
              previous_status: previousStatus,
              new_status: newStatus,
              order_number: order.order_number,
            },
          });
          await manager.save(AuditLogEntity, auditLog);

          return order.id;
        }
      );

    const updatedOrder =
      await OrderEntity.findOne({
        where: {
          id: updatedOrderId,
          is_delete: 0,
        },
      });

    if (!updatedOrder) {
      throw new NotFoundError(
        'Order not found'
      );
    }

    return this.toModel(
      updatedOrder
    );
  }

  public async checkout(
    userId: number,
    dto: CheckoutOrderDto
  ): Promise<OrderModel> {
    const orderId =
      await this.database.runInTransaction(
        async (
          manager: EntityManager
        ): Promise<number> => {
          const cart =
            await this.getCustomerCart(
              manager,
              userId
            );

          const cartItems =
            await this.getCartItems(
              manager,
              cart.id
            );

          const address =
            await this.getOwnedAddress(
              manager,
              userId,
              dto.address_id
            );

          const coupon =
            await this.getValidCoupon(
              manager,
              dto.coupon_code
            );

          const sortedCartItems =
            [...cartItems].sort(
              (first, second) =>
                first.product_id -
                second.product_id
            );

          const checkedItems: Array<{
            cartItem: CartItemEntity;
            product: ProductEntity;
            lineTotalInCents: number;
          }> = [];

          let subtotalInCents = 0;

          for (
            const cartItem
            of sortedCartItems
          ) {
            const product =
              await this.getLockedProduct(
                manager,
                cartItem.product_id
              );

            this.validateProductStock(
              product,
              cartItem.quantity
            );

            const unitPriceInCents =
              this.toCents(
                product.price
              );

            const lineTotalInCents =
              unitPriceInCents *
              cartItem.quantity;

            subtotalInCents +=
              lineTotalInCents;

            checkedItems.push({
              cartItem,
              product,
              lineTotalInCents,
            });
          }

          const discountInCents =
            this.calculateDiscountInCents(
              coupon,
              subtotalInCents
            );

          const taxableAmountInCents =
            Math.max(
              subtotalInCents -
                discountInCents,
              0
            );

          const taxInCents =
            Math.round(
              taxableAmountInCents *
                TAX_RATE
            );

          const shippingInCents =
            Math.round(
              SHIPPING_AMOUNT * 100
            );

          const grandTotalInCents =
            Math.max(
              taxableAmountInCents +
                taxInCents +
                shippingInCents,
              0
            );

          const order =
            manager.create(
              OrderEntity,
              {
                order_number:
                  this.generateOrderNumber(),

                user_id:
                  userId,

                address_id:
                  address.id,

                delivery_address: {
                  line1:
                    address.line1,

                  line2:
                    address.line2,

                  city:
                    address.city,

                  state:
                    address.state,

                  postal_code:
                    address.postal_code,

                  country:
                    address.country,
                },

                coupon_id:
                  coupon?.id ?? null,

                subtotal:
                  this.formatMoney(
                    subtotalInCents
                  ),

                discount_amount:
                  this.formatMoney(
                    discountInCents
                  ),

                tax_amount:
                  this.formatMoney(
                    taxInCents
                  ),

                shipping_amount:
                  this.formatMoney(
                    shippingInCents
                  ),

                grand_total:
                  this.formatMoney(
                    grandTotalInCents
                  ),

                status:
                  OrderStatus
                    .PENDING_PAYMENT,
              }
            );

          const savedOrder =
            await manager.save(
              OrderEntity,
              order
            );

          const orderItems =
            checkedItems.map(
              ({
                cartItem,
                product,
                lineTotalInCents,
              }) =>
                manager.create(
                  OrderItemEntity,
                  {
                    order_id:
                      savedOrder.id,

                    product_id:
                      product.id,

                    product_sku:
                      product.sku,

                    product_name:
                      product.name,

                    unit_price:
                      this.formatMoney(
                        this.toCents(
                          product.price
                        )
                      ),

                    quantity:
                      cartItem.quantity,

                    line_total:
                      this.formatMoney(
                        lineTotalInCents
                      ),
                  }
                )
            );

          await manager.save(
            OrderItemEntity,
            orderItems
          );

          for (
            const checkedItem
            of checkedItems
          ) {
            checkedItem.product
              .stock_quantity -=
              checkedItem.cartItem
                .quantity;

            await manager.save(
              ProductEntity,
              checkedItem.product
            );
          }

          if (coupon) {
            coupon.used_count += 1;

            await manager.save(
              CouponEntity,
              coupon
            );
          }

          for (
            const cartItem
            of cartItems
          ) {
            cartItem.is_delete = 1;
          }

          await manager.save(
            CartItemEntity,
            cartItems
          );

          const auditLog = manager.create(AuditLogEntity, {
            user_id: userId,
            action: 'ORDER_CREATED',
            entity_type: 'ORDER',
            entity_id: String(savedOrder.id),
            metadata: {
              order_number: savedOrder.order_number,
              grand_total: savedOrder.grand_total,
              items_count: orderItems.length,
            },
          });
          await manager.save(AuditLogEntity, auditLog);

          return savedOrder.id;
        }
      );

    return this.getOrderByIdForUser(
      userId,
      orderId
    );
  }

  private async getCustomerCart(
    manager: EntityManager,
    userId: number
  ): Promise<CartEntity> {
    const cart =
      await manager
        .getRepository(CartEntity)
        .createQueryBuilder('cart')
        .setLock(
          'pessimistic_write'
        )
        .where(
          'cart.user_id = :userId',
          {
            userId,
          }
        )
        .andWhere(
          'cart.is_delete = :isDelete',
          {
            isDelete: 0,
          }
        )
        .getOne();

    if (!cart) {
      throw new BadRequestError(
        'Cart not found'
      );
    }

    return cart;
  }

  private async getCartItems(
    manager: EntityManager,
    cartId: number
  ): Promise<CartItemEntity[]> {
    const items =
      await manager
        .getRepository(
          CartItemEntity
        )
        .createQueryBuilder(
          'cartItem'
        )
        .setLock(
          'pessimistic_write'
        )
        .where(
          'cartItem.cart_id = :cartId',
          {
            cartId,
          }
        )
        .andWhere(
          'cartItem.is_delete = :isDelete',
          {
            isDelete: 0,
          }
        )
        .orderBy(
          'cartItem.id',
          'ASC'
        )
        .getMany();

    if (items.length === 0) {
      throw new BadRequestError(
        'Cart is empty'
      );
    }

    return items;
  }

  private async getLockedProduct(
    manager: EntityManager,
    productId: number
  ): Promise<ProductEntity> {
    const product =
      await manager
        .getRepository(
          ProductEntity
        )
        .createQueryBuilder(
          'product'
        )
        .setLock(
          'pessimistic_write'
        )
        .where(
          'product.id = :productId',
          {
            productId,
          }
        )
        .andWhere(
          'product.is_delete = :isDelete',
          {
            isDelete: 0,
          }
        )
        .andWhere(
          'product.is_active = :isActive',
          {
            isActive: true,
          }
        )
        .getOne();

    if (!product) {
      throw new BadRequestError(
        'Product does not exist or is inactive'
      );
    }

    return product;
  }

  private validateProductStock(
    product: ProductEntity,
    requestedQuantity: number
  ): void {
    if (
      requestedQuantity <= 0 ||
      !Number.isInteger(
        requestedQuantity
      )
    ) {
      throw new BadRequestError(
        'Invalid product quantity'
      );
    }

    if (
      product.stock_quantity <
      requestedQuantity
    ) {
      throw new BadRequestError(
        `Insufficient stock for ${product.name}`
      );
    }
  }

  private async getOwnedAddress(
    manager: EntityManager,
    userId: number,
    addressId: number
  ): Promise<AddressEntity> {
    const address =
      await manager.findOne(
        AddressEntity,
        {
          where: {
            id: addressId,
            user_id: userId,
            is_delete: 0,
          },
        }
      );

    if (!address) {
      throw new BadRequestError(
        'Delivery address not found'
      );
    }

    return address;
  }

  private async getValidCoupon(
    manager: EntityManager,
    couponCode?: string
  ): Promise<CouponEntity | null> {
    if (!couponCode) {
      return null;
    }

    const normalizedCode =
      couponCode
        .trim()
        .toUpperCase();

    const coupon =
      await manager
        .getRepository(
          CouponEntity
        )
        .createQueryBuilder(
          'coupon'
        )
        .setLock(
          'pessimistic_write'
        )
        .where(
          'coupon.code = :code',
          {
            code:
              normalizedCode,
          }
        )
        .andWhere(
          'coupon.is_active = :isActive',
          {
            isActive: true,
          }
        )
        .andWhere(
          'coupon.is_delete = :isDelete',
          {
            isDelete: 0,
          }
        )
        .getOne();

    if (!coupon) {
      throw new BadRequestError(
        'Coupon is invalid or inactive'
      );
    }

    const now =
      new Date();

    if (
      coupon.start_date &&
      now < coupon.start_date
    ) {
      throw new BadRequestError(
        'Coupon is not active yet'
      );
    }

    if (
      coupon.expiry_date &&
      now > coupon.expiry_date
    ) {
      throw new BadRequestError(
        'Coupon has expired'
      );
    }

    if (
      coupon.usage_limit !== null &&
      coupon.used_count >=
        coupon.usage_limit
    ) {
      throw new BadRequestError(
        'Coupon usage limit reached'
      );
    }

    return coupon;
  }

  private calculateDiscountInCents(
    coupon: CouponEntity | null,
    subtotalInCents: number
  ): number {
    if (!coupon) {
      return 0;
    }

    const minimumOrderInCents =
      coupon.minimum_order_value
        ? this.toCents(
            coupon
              .minimum_order_value
          )
        : 0;

    if (
      subtotalInCents <
      minimumOrderInCents
    ) {
      throw new BadRequestError(
        'Order does not meet coupon minimum value'
      );
    }

    let discountInCents: number;

    if (
      coupon.type ===
      CouponType.PERCENTAGE
    ) {
      discountInCents =
        Math.round(
          subtotalInCents *
            (
              Number(
                coupon.discount_value
              ) / 100
            )
        );
    } else {
      discountInCents =
        this.toCents(
          coupon.discount_value
        );
    }

    if (
      coupon.maximum_discount
    ) {
      const maximumDiscountInCents =
        this.toCents(
          coupon.maximum_discount
        );

      discountInCents =
        Math.min(
          discountInCents,
          maximumDiscountInCents
        );
    }

    return Math.min(
      discountInCents,
      subtotalInCents
    );
  }

  // NEW: validates allowed status changes
  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus
  ): void {
    const allowedTransitions:
      Record<
        OrderStatus,
        OrderStatus[]
      > = {
        [OrderStatus.PENDING_PAYMENT]: [
          OrderStatus.CANCELLED,
        ],

        [OrderStatus.PAYMENT_FAILED]: [
          OrderStatus.CANCELLED,
        ],

        [OrderStatus.CONFIRMED]: [
          OrderStatus.PROCESSING,
          OrderStatus.CANCELLED,
        ],

        [OrderStatus.PROCESSING]: [
          OrderStatus.SHIPPED,
          OrderStatus.CANCELLED,
        ],

        [OrderStatus.SHIPPED]: [
          OrderStatus.DELIVERED,
        ],

        [OrderStatus.DELIVERED]: [],

        [OrderStatus.CANCELLED]: [],

        [OrderStatus.REFUNDED]: [],
      };

    const isAllowed =
      allowedTransitions[
        currentStatus
      ].includes(
        newStatus
      );

    if (!isAllowed) {
      throw new BadRequestError(
        `Invalid order status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  private generateOrderNumber(): string {
    const uniquePart =
      randomUUID()
        .replace(/-/g, '')
        .slice(0, 16)
        .toUpperCase();

    return `ORD-${uniquePart}`;
  }

  private toCents(
    value: string
  ): number {
    return Math.round(
      Number(value) * 100
    );
  }

  private formatMoney(
    cents: number
  ): string {
    return (
      cents / 100
    ).toFixed(2);
  }

  private async toModel(
    order: OrderEntity
  ): Promise<OrderModel> {
    const items =
      await OrderItemEntity.find({
        where: {
          order_id: order.id,
          is_delete: 0,
        },
        order: {
          id: 'ASC',
        },
      });

    const model =
      new OrderModel();

    model.id =
      order.id;

    model.order_number =
      order.order_number;

    model.user_id =
      order.user_id;

    model.address_id =
      order.address_id;

    model.delivery_address =
      order.delivery_address;

    model.coupon_id =
      order.coupon_id;

    model.subtotal =
      order.subtotal;

    model.discount_amount =
      order.discount_amount;

    model.tax_amount =
      order.tax_amount;

    model.shipping_amount =
      order.shipping_amount;

    model.grand_total =
      order.grand_total;

    model.status =
      order.status;

    model.items =
      items.map(
        (item) => {
          const itemModel =
            new OrderItemModel();

          itemModel.id =
            item.id;

          itemModel.order_id =
            item.order_id;

          itemModel.product_id =
            item.product_id;

          itemModel.product_sku =
            item.product_sku;

          itemModel.product_name =
            item.product_name;

          itemModel.unit_price =
            item.unit_price;

          itemModel.quantity =
            item.quantity;

          itemModel.line_total =
            item.line_total;

          return itemModel;
        }
      );

    return model;
  }
}

export interface PaginatedOrdersResponse {
  orders: OrderModel[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default OrderService;