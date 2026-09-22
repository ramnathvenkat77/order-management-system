import 'reflect-metadata';
import 'dotenv/config';
import bcrypt from 'bcrypt';

import { getPostgresConnection } from '../data-source';

import {
  UsersEntity,
  UserRole,
  UserStatus,
} from '../../entities/usersEntity';

import { CategoryEntity } from '../../entities/categoryEntity';
import { ProductEntity } from '../../entities/productEntity';

import {
  CouponEntity,
  CouponType,
} from '../../entities/couponEntity';
async function seedUsers(): Promise<void> {
  const dataSource = getPostgresConnection();

  await dataSource.initialize();

  const userRepository = dataSource.getRepository(UsersEntity);

  const adminEmail = 'admin@oms.local';
  const operationsEmail = 'operations@oms.local';

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const operationsPassword = process.env.SEED_OPERATIONS_PASSWORD;

  if (!adminPassword || !operationsPassword) {
    throw new Error('Seed passwords are missing in environment variables');
  }

  const existingAdmin = await userRepository.findOne({
    where: {
      email: adminEmail,
    },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const admin = userRepository.create({
      name: 'System Admin',
      email: adminEmail,
      password_hash: passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });

    await userRepository.save(admin);

    console.log('Admin user seeded successfully');
  }

  const existingOperations = await userRepository.findOne({
    where: {
      email: operationsEmail,
    },
  });

  if (!existingOperations) {
    const passwordHash = await bcrypt.hash(
      operationsPassword,
      12
    );

    const operationsUser = userRepository.create({
      name: 'Operations User',
      email: operationsEmail,
      password_hash: passwordHash,
      role: UserRole.OPERATIONS,
      status: UserStatus.ACTIVE,
    });

    await userRepository.save(operationsUser);

    console.log('Operations user seeded successfully');
  }

  await dataSource.destroy();
}

async function seedProducts(): Promise<void> {
  const dataSource = getPostgresConnection();

  await dataSource.initialize();

  const productRepository =
    dataSource.getRepository(ProductEntity);

  const categoryRepository =
    dataSource.getRepository(CategoryEntity);

  const electronicsCategory =
    await categoryRepository.findOne({
      where: {
        name: 'Electronics',
      },
    });

  const clothingCategory =
    await categoryRepository.findOne({
      where: {
        name: 'Clothing',
      },
    });

  const homeCategory =
    await categoryRepository.findOne({
      where: {
        name: 'Home',
      },
    });

  if (
    !electronicsCategory ||
    !clothingCategory ||
    !homeCategory
  ) {
    throw new Error(
      'Required categories are missing. Run category seed first.'
    );
  }

  const products = [
    {
      sku: 'ELEC-001',
      name: 'Wireless Headphones',
      description: 'Bluetooth wireless headphones',
      price: '2999.00',
      stock_quantity: 50,
      is_active: true,
      category_id: electronicsCategory.id,
    },
    {
      sku: 'CLOTH-001',
      name: 'Cotton T-Shirt',
      description: 'Comfortable cotton T-shirt',
      price: '799.00',
      stock_quantity: 100,
      is_active: true,
      category_id: clothingCategory.id,
    },
    {
      sku: 'HOME-001',
      name: 'Table Lamp',
      description: 'LED table lamp for home use',
      price: '1299.00',
      stock_quantity: 40,
      is_active: true,
      category_id: homeCategory.id,
    },
  ];

  for (const productData of products) {
    const existingProduct =
      await productRepository.findOne({
        where: {
          sku: productData.sku,
        },
      });

    if (!existingProduct) {
      const product =
        productRepository.create(productData);

      await productRepository.save(product);

      console.log(
        `Product seeded: ${productData.name}`
      );
    } else {
      console.log(
        `Product already exists: ${productData.name}`
      );
    }
  }

  await dataSource.destroy();
}

async function seedCategories(): Promise<void> {
  const dataSource = getPostgresConnection();

  await dataSource.initialize();

  const categoryRepository =
    dataSource.getRepository(CategoryEntity);

  const categories = [
    {
      name: 'Electronics',
      description: 'Electronic devices and accessories',
      is_active: true,
    },
    {
      name: 'Clothing',
      description: 'Clothing and apparel products',
      is_active: true,
    },
    {
      name: 'Home',
      description: 'Home and household products',
      is_active: true,
    },
  ];

  for (const categoryData of categories) {
    const existingCategory =
      await categoryRepository.findOne({
        where: {
          name: categoryData.name,
        },
      });

    if (!existingCategory) {
      const category =
        categoryRepository.create(categoryData);

      await categoryRepository.save(category);

      console.log(
        `Category seeded: ${categoryData.name}`
      );
    } else {
      console.log(
        `Category already exists: ${categoryData.name}`
      );
    }
  }

  await dataSource.destroy();
}
async function seedCoupons(): Promise<void> {
  const dataSource = getPostgresConnection();

  await dataSource.initialize();

  const couponRepository =
    dataSource.getRepository(CouponEntity);

  const coupons = [
    {
      code: 'WELCOME10',
      type: CouponType.PERCENTAGE,
      discount_value: '10.00',
      minimum_order_value: '1000.00',
      maximum_discount: '500.00',
      start_date: null,
      expiry_date: null,
      usage_limit: 100,
      used_count: 0,
      is_active: true,
    },
    {
      code: 'FLAT200',
      type: CouponType.FIXED,
      discount_value: '200.00',
      minimum_order_value: '1500.00',
      maximum_discount: null,
      start_date: null,
      expiry_date: null,
      usage_limit: 100,
      used_count: 0,
      is_active: true,
    },
  ];

  for (const couponData of coupons) {
    const existingCoupon =
      await couponRepository.findOne({
        where: {
          code: couponData.code,
        },
      });

    if (!existingCoupon) {
      const coupon =
        couponRepository.create(couponData);

      await couponRepository.save(coupon);

      console.log(
        `Coupon seeded: ${couponData.code}`
      );
    } else {
      console.log(
        `Coupon already exists: ${couponData.code}`
      );
    }
  }

  await dataSource.destroy();
}
async function runSeed(): Promise<void> { 
    try { await seedUsers();
         await seedCategories(); 
         await seedProducts();
         await seedCoupons();
          console.log('Initial seed completed successfully');
         } 
         catch (error) 
         {
             console.error('Initial seed failed:', error);
              process.exitCode = 1;
             }
             }
              void runSeed();