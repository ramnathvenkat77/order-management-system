import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';

import Database from './database/database';

import { PATH } from './config';

import { AuthController } from './controllers/auth/authController.controller';
import { UserManagementController } from './controllers/usermanagement/userManagementController.controller';
import { CategoryController } from './controllers/category/categoryController.controller';
import { ProductController } from './controllers/product/productController.controller';
import { CartController } from './controllers/cart/cartController.controller';
import { AddressController } from './controllers/address/addressController.controller';
import { CouponController } from './controllers/coupon/couponController.controller';
import { OrderController } from './controllers/order/orderController.controller';
import { PaymentController } from './controllers/payment/paymentController.controller';

export class App {
  public app: express.Application;
  public port: number;

  private database =
    Database.getInstance();

  constructor(port: number) {
    this.app = express();
    this.port = port;

    this.initializeDatabase();
    this.initializeMiddlewares();
    this.initializeControllers();
  }

  private initializeDatabase(): void {
    void this.database.connectToDB();
  }

  private initializeMiddlewares(): void {
    this.app.use(
      express.json({
        limit: '100mb',
      })
    );

    this.app.use(
      express.urlencoded({
        extended: true,
      })
    );

    this.app.use(
      multer({
        limits: {
          fileSize:
            50 * 1024 * 1024,
        },
      }).any()
    );

    this.app.use(cors());
    this.app.use(helmet());
  }

  private initializeControllers(): void {
    this.app.post(
  '/api/v1/orders-test',
  (
    _req: express.Request,
    res: express.Response
  ) => {
    res.status(200).json({
      message: 'Order test route works',
    });
  }
);
    const authController =
      new AuthController();

    const userManagementController =
      new UserManagementController();

    const categoryController =
      new CategoryController();

    const productController =
      new ProductController();

    const cartController =
      new CartController();

    const addressController =
      new AddressController();

    const couponController =
      new CouponController();

    const orderController =
      new OrderController();
      const paymentController =
  new PaymentController();

    this.app.use(
      PATH,
      authController.router
    );

    this.app.use(
      PATH,
      userManagementController.router
    );

    this.app.use(
      PATH,
      categoryController.router
    );

    this.app.use(
      PATH,
      productController.router
    );

    this.app.use(
      PATH,
      cartController.router
    );

    this.app.use(
      PATH,
      addressController.router
    );

    this.app.use(
      PATH,
      couponController.router
    );

    this.app.use(
      PATH,
      orderController.router
    );

    this.app.use(
      PATH,
      paymentController.router
    );
  }

  public listen(): void {
    this.app.listen(
      this.port,
      () => {
        console.log(
          `App listening on the port ${this.port}`
        );
      }
    );
  }
}