import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { UsersEntity } from '../entities/usersEntity';
import { CategoryEntity } from '../entities/categoryEntity';
import { ProductEntity } from '../entities/productEntity';
import { AddressEntity } from '../entities/addressEntity';
import { CartEntity } from '../entities/cartEntity';
import { CartItemEntity } from '../entities/cartItemEntity';
import { CouponEntity } from '../entities/couponEntity';
import { OrderEntity } from '../entities/orderEntity';
import { OrderItemEntity } from '../entities/orderItemEntity';
import { PaymentEntity } from '../entities/paymentEntity';
import { AuditLogEntity } from '../entities/auditLogEntity';

export const getPostgresConnection = (): DataSource => {
  const postgresConnection = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [
      UsersEntity,
      CategoryEntity,
      ProductEntity,
      AddressEntity,
      CartEntity,
      CartItemEntity,
      CouponEntity,
      OrderEntity,
      OrderItemEntity,
      PaymentEntity,
      AuditLogEntity,
    ],
    migrations: [__dirname + '/migrations/*.{js,ts}'],
    synchronize: false,

    logging: true,

    extra: {
      max: 10,
      min: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    },
  });

  return postgresConnection;
};