import { randomUUID } from 'crypto';
import { EntityManager } from 'typeorm';

import { BaseServices } from '../baseService.services';

import Database from '../../database/database';

import {
  PaymentModel,
} from '../../database/repository/payment/payment.model';

import {
  SimulatePaymentDto,
  SimulatedPaymentOutcome,
} from '../../database/repository/payment/payment.dto';

import {
  PaymentEntity,
  PaymentStatus,
} from '../../entities/paymentEntity';

import {
  OrderEntity,
  OrderStatus,
} from '../../entities/orderEntity';

import {
  BadRequestError,
  NotFoundError,
} from '../../core/ApiError';

class PaymentService extends BaseServices<
  PaymentModel,
  SimulatePaymentDto
> {
  private database =
    Database.getInstance();

  public getModel(): PaymentModel {
    return new PaymentModel();
  }

  public getDTO(): new () => SimulatePaymentDto {
    return SimulatePaymentDto;
  }

  public getModuleName(): string {
    return 'Payment';
  }

  public async payForOrder(
    userId: number,
    orderId: number,
    dto: SimulatePaymentDto
  ): Promise<PaymentModel> {
    const paymentId =
      await this.database.runInTransaction(
        async (
          manager: EntityManager
        ): Promise<number> => {
          const order =
            await this.getLockedOwnedOrder(
              manager,
              userId,
              orderId
            );

          const existingSuccessfulPayment =
            await manager.findOne(
              PaymentEntity,
              {
                where: {
                  order_id: order.id,
                  status:
                    PaymentStatus.SUCCESS,
                  is_delete: 0,
                },
              }
            );

          if (
            existingSuccessfulPayment
          ) {
            return existingSuccessfulPayment.id;
          }

          if (
            order.status ===
              OrderStatus.CONFIRMED ||
            order.status ===
              OrderStatus.PROCESSING ||
            order.status ===
              OrderStatus.SHIPPED ||
            order.status ===
              OrderStatus.DELIVERED ||
            order.status ===
              OrderStatus.CANCELLED ||
            order.status ===
              OrderStatus.REFUNDED
          ) {
            throw new BadRequestError(
              'Order cannot be paid in its current status'
            );
          }

          if (
            order.status ===
            OrderStatus.PAYMENT_FAILED
          ) {
            order.status =
              OrderStatus.PENDING_PAYMENT;

            await manager.save(
              OrderEntity,
              order
            );
          }

          if (
            order.status !==
            OrderStatus.PENDING_PAYMENT
          ) {
            throw new BadRequestError(
              'Order is not awaiting payment'
            );
          }

          const payment =
            manager.create(
              PaymentEntity,
              {
                order_id:
                  order.id,

                amount:
                  order.grand_total,

                status:
                  PaymentStatus.PENDING,

                provider:
                  'SIMULATED_PROVIDER',

                provider_reference:
                  this.generateProviderReference(),
              }
            );

          const savedPayment =
            await manager.save(
              PaymentEntity,
              payment
            );

          if (
            dto.outcome ===
            SimulatedPaymentOutcome.SUCCESS
          ) {
            savedPayment.status =
              PaymentStatus.SUCCESS;

            order.status =
              OrderStatus.CONFIRMED;
          } else {
            savedPayment.status =
              PaymentStatus.FAILED;

            order.status =
              OrderStatus.PAYMENT_FAILED;
          }

          await manager.save(
            PaymentEntity,
            savedPayment
          );

          await manager.save(
            OrderEntity,
            order
          );

          return savedPayment.id;
        }
      );

    return this.getPaymentById(
      paymentId
    );
  }

  private async getLockedOwnedOrder(
    manager: EntityManager,
    userId: number,
    orderId: number
  ): Promise<OrderEntity> {
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
          'order.user_id = :userId',
          {
            userId,
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

    return order;
  }

  private async getPaymentById(
    paymentId: number
  ): Promise<PaymentModel> {
    const payment =
      await PaymentEntity.findOne({
        where: {
          id: paymentId,
          is_delete: 0,
        },
      });

    if (!payment) {
      throw new NotFoundError(
        'Payment not found'
      );
    }

    return this.toModel(
      payment
    );
  }

  private generateProviderReference(): string {
    const uniquePart =
      randomUUID()
        .replace(/-/g, '')
        .slice(0, 20)
        .toUpperCase();

    return `PAY-${uniquePart}`;
  }

  private toModel(
    payment: PaymentEntity
  ): PaymentModel {
    const model =
      new PaymentModel();

    model.id =
      payment.id;

    model.order_id =
      payment.order_id;

    model.amount =
      payment.amount;

    model.status =
      payment.status;

    model.provider =
      payment.provider;

    model.provider_reference =
      payment.provider_reference;

    return model;
  }
}

export default PaymentService;