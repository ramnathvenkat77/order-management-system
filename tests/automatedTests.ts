import 'dotenv/config';
import assert from 'node:assert';
import http from 'node:http';
import { App } from '../src/app';
import Database from '../src/database/database';
import { createjwt } from '../src/utils/jwt/jwt';
import { UsersEntity, UserRole, UserStatus } from '../src/entities/usersEntity';
import { AddressEntity } from '../src/entities/addressEntity';
import { ProductEntity } from '../src/entities/productEntity';
import { CategoryEntity } from '../src/entities/categoryEntity';
import { CartEntity } from '../src/entities/cartEntity';
import { CartItemEntity } from '../src/entities/cartItemEntity';
import { CouponEntity, CouponType } from '../src/entities/couponEntity';
import { OrderEntity, OrderStatus } from '../src/entities/orderEntity';
import { OrderItemEntity } from '../src/entities/orderItemEntity';
import { PaymentEntity, PaymentStatus } from '../src/entities/paymentEntity';
import { AuditLogEntity } from '../src/entities/auditLogEntity';

const TEST_PORT = 3005;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api/v1`;

async function runTestSuite() {
  console.log('--- STARTING AUTOMATED TEST SUITE ---');

  const db = Database.getInstance();
  await db.connectToDB();

  const appInstance = new App(TEST_PORT);
  let server: http.Server;

  await new Promise<void>((resolve) => {
    server = appInstance.app.listen(TEST_PORT, () => {
      resolve();
    });
  });

  try {
    // 0. Setup test users and data
    console.log('Setting up test fixtures...');

    let customer1 = await UsersEntity.findOne({ where: { email: 'cust1@test.local' } });
    if (!customer1) {
      customer1 = await UsersEntity.create({
        name: 'Customer One',
        email: 'cust1@test.local',
        password_hash: 'dummyhash',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      }).save();
    }

    let customer2 = await UsersEntity.findOne({ where: { email: 'cust2@test.local' } });
    if (!customer2) {
      customer2 = await UsersEntity.create({
        name: 'Customer Two',
        email: 'cust2@test.local',
        password_hash: 'dummyhash',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      }).save();
    }

    let admin = await UsersEntity.findOne({ where: { email: 'admin@oms.local' } });
    if (!admin) {
      admin = await UsersEntity.create({
        name: 'System Admin',
        email: 'admin@oms.local',
        password_hash: 'dummyhash',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      }).save();
    }

    const tokenCust1 = createjwt({ userId: customer1.id, email: customer1.email, role: customer1.role });
    const tokenCust2 = createjwt({ userId: customer2.id, email: customer2.email, role: customer2.role });
    const tokenAdmin = createjwt({ userId: admin.id, email: admin.email, role: admin.role });

    // Addresses
    let address1 = await AddressEntity.findOne({ where: { user_id: customer1.id, is_delete: 0 } });
    if (!address1) {
      address1 = await AddressEntity.create({
        user_id: customer1.id,
        line1: '123 Main St',
        city: 'Metropolis',
        state: 'NY',
        postal_code: '10001',
        country: 'USA',
        is_default: true,
      }).save();
    }

    let address2 = await AddressEntity.findOne({ where: { user_id: customer2.id, is_delete: 0 } });
    if (!address2) {
      address2 = await AddressEntity.create({
        user_id: customer2.id,
        line1: '456 Oak St',
        city: 'Gotham',
        state: 'NJ',
        postal_code: '07001',
        country: 'USA',
        is_default: true,
      }).save();
    }

    // Category
    let category = await CategoryEntity.findOne({ where: { name: 'Electronics', is_delete: 0 } });
    if (!category) {
      category = await CategoryEntity.create({
        name: 'Electronics',
        description: 'Electronic devices',
        is_active: true,
      }).save();
    }

    // Helper functions
    async function apiRequest(path: string, options: RequestInit = {}) {
      const url = `${BASE_URL}${path}`;
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      const json = await res.json().catch(() => ({}));
      return { status: res.status, body: json };
    }

    // --- TEST 1: Unauthenticated protected endpoint ---
    console.log('Running Test 1: Unauthenticated protected endpoint rejection...');
    const t1 = await apiRequest('/orders');
    assert.strictEqual(t1.status, 401, 'Expected 401 Unauthorized for unauthenticated request');
    console.log('✓ Test 1 Passed: Unauthenticated request rejected with 401');

    // --- TEST 2: CUSTOMER cannot use ADMIN API ---
    console.log('Running Test 2: CUSTOMER cannot use ADMIN API...');
    const t2 = await apiRequest('/orders/admin', {
      headers: { Authorization: `Bearer ${tokenCust1}` },
    });
    assert.strictEqual(t2.status, 403, 'Expected 403 Forbidden when CUSTOMER accesses ADMIN API');
    console.log('✓ Test 2 Passed: CUSTOMER accessing ADMIN API rejected with 403');

    // --- TEST 3: Public registration cannot supply role to become ADMIN ---
    console.log('Running Test 3: Public registration privilege escalation prevention...');
    const t3Hacker = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Hacker User',
        email: `hacker-${Date.now()}@test.local`,
        password: 'password123',
        role: 'ADMIN',
      }),
    });
    assert.strictEqual(t3Hacker.status, 400, 'Registration with role override must be rejected with 400');
    console.log('✓ Test 3 Passed: Public registration cannot supply role to become ADMIN');

    // --- TEST 4: Health check endpoint ---
    console.log('Running Test 4: Health check endpoint...');
    const t4Health = await apiRequest('/health');
    assert.strictEqual(t4Health.status, 200);
    assert.strictEqual(t4Health.body.data.apiStatus, 'healthy');
    assert.strictEqual(t4Health.body.data.databaseStatus, 'connected');
    assert.ok(t4Health.body.data.timestamp);
    console.log('✓ Test 4 Passed: Health check endpoint verified');

    // --- TEST 5: Empty cart checkout rejection ---
    console.log('Running Test 5: Empty cart checkout rejection...');
    let cartCust1 = await CartEntity.findOne({ where: { user_id: customer1.id, is_delete: 0 } });
    if (!cartCust1) {
      cartCust1 = await CartEntity.create({ user_id: customer1.id }).save();
    }
    await CartItemEntity.delete({ cart_id: cartCust1.id });

    const t5 = await apiRequest('/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCust1}` },
      body: JSON.stringify({ address_id: address1.id }),
    });
    assert.strictEqual(t5.status, 400);
    assert.match(t5.body.message, /cart is empty/i);
    console.log('✓ Test 5 Passed: Empty cart checkout rejected with 400');

    // --- TEST 6: Insufficient stock rejection ---
    console.log('Running Test 6: Insufficient stock rejection...');
    let productStock = await ProductEntity.findOne({ where: { sku: 'TEST-STOCK-1' } });
    if (!productStock) {
      productStock = await ProductEntity.create({
        sku: 'TEST-STOCK-1',
        name: 'Stock Test Product',
        description: 'Testing stock limits',
        price: '100.00',
        stock_quantity: 2,
        is_active: true,
        category_id: category.id,
      }).save();
    } else {
      productStock.stock_quantity = 2;
      productStock.is_active = true;
      await productStock.save();
    }

    // Add 5 items to cart
    await CartItemEntity.create({
      cart_id: cartCust1.id,
      product_id: productStock.id,
      quantity: 5,
    }).save();

    const t6 = await apiRequest('/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCust1}` },
      body: JSON.stringify({ address_id: address1.id }),
    });
    assert.strictEqual(t6.status, 400);
    assert.match(t6.body.message, /insufficient stock/i);
    console.log('✓ Test 6 Passed: Insufficient stock rejected with 400');

    // Reset cart for customer 1
    await CartItemEntity.delete({ cart_id: cartCust1.id });

    // --- TEST 7: Valid coupon validation API ---
    console.log('Running Test 7: Valid coupon validation API...');
    let mainProduct = await ProductEntity.findOne({ where: { sku: 'ELEC-001' } });
    if (!mainProduct) {
      mainProduct = await ProductEntity.create({
        sku: 'ELEC-001',
        name: 'Wireless Headphones',
        description: 'Headphones',
        price: '2999.00',
        stock_quantity: 50,
        is_active: true,
        category_id: category.id,
      }).save();
    }

    await CartItemEntity.create({
      cart_id: cartCust1.id,
      product_id: mainProduct.id,
      quantity: 1,
    }).save();

    const t7 = await apiRequest('/coupons/validate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCust1}` },
      body: JSON.stringify({ code: 'WELCOME10' }),
    });
    assert.strictEqual(t7.status, 200);
    assert.strictEqual(t7.body.data.subtotal, '2999.00');
    assert.strictEqual(t7.body.data.discount, '299.90');
    assert.strictEqual(t7.body.data.payable_amount, '2699.10');
    console.log('✓ Test 7 Passed: Coupon validation returned correct calculations');

    // --- TEST 8: Expired coupon rejection ---
    console.log('Running Test 8: Expired coupon rejection...');
    const expiredCode = 'EXPIRED50';
    await CouponEntity.delete({ code: expiredCode });
    await CouponEntity.create({
      code: expiredCode,
      type: CouponType.PERCENTAGE,
      discount_value: '50.00',
      minimum_order_value: '100.00',
      expiry_date: new Date(Date.now() - 86400000), // yesterday
      is_active: true,
    }).save();

    const t8 = await apiRequest('/coupons/validate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCust1}` },
      body: JSON.stringify({ code: expiredCode }),
    });
    assert.strictEqual(t8.status, 400);
    assert.match(t8.body.message, /expired/i);
    console.log('✓ Test 8 Passed: Expired coupon rejected with 400');

    // --- TEST 9: Exhausted coupon rejection ---
    console.log('Running Test 9: Exhausted coupon rejection...');
    const exhaustedCode = 'EXHAUSTED';
    await CouponEntity.delete({ code: exhaustedCode });
    await CouponEntity.create({
      code: exhaustedCode,
      type: CouponType.FIXED,
      discount_value: '50.00',
      minimum_order_value: '100.00',
      usage_limit: 1,
      used_count: 1,
      is_active: true,
    }).save();

    const t9 = await apiRequest('/coupons/validate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCust1}` },
      body: JSON.stringify({ code: exhaustedCode }),
    });
    assert.strictEqual(t9.status, 400);
    assert.match(t9.body.message, /usage limit reached/i);
    console.log('✓ Test 9 Passed: Exhausted coupon rejected with 400');

    // --- TEST 10: Minimum-order coupon failure ---
    console.log('Running Test 10: Minimum-order coupon failure...');
    const highMinCode = 'HIGHMIN';
    await CouponEntity.delete({ code: highMinCode });
    await CouponEntity.create({
      code: highMinCode,
      type: CouponType.FIXED,
      discount_value: '100.00',
      minimum_order_value: '10000.00', // high min order
      is_active: true,
    }).save();

    const t10 = await apiRequest('/coupons/validate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCust1}` },
      body: JSON.stringify({ code: highMinCode }),
    });
    assert.strictEqual(t10.status, 400);
    assert.match(t10.body.message, /minimum value/i);
    console.log('✓ Test 10 Passed: Below-minimum order coupon rejected with 400');

    // --- TEST 11: Correct checkout calculations (subtotal, discount, grand total) ---
    console.log('Running Test 11: Correct checkout calculations with coupon...');
    const couponWelcome = await CouponEntity.findOne({ where: { code: 'WELCOME10' } });
    const usedCountBefore = couponWelcome?.used_count ?? 0;

    const t11 = await apiRequest('/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCust1}` },
      body: JSON.stringify({
        address_id: address1.id,
        coupon_code: 'WELCOME10',
      }),
    });
    assert.strictEqual(t11.status, 200);
    const orderCreated = t11.body.data;
    assert.strictEqual(orderCreated.subtotal, '2999.00');
    assert.strictEqual(orderCreated.discount_amount, '299.90');
    assert.strictEqual(orderCreated.grand_total, '2699.10');
    assert.strictEqual(orderCreated.status, OrderStatus.PENDING_PAYMENT);
    assert.strictEqual(orderCreated.items.length, 1);
    assert.strictEqual(orderCreated.items[0].product_sku, 'ELEC-001');

    const couponAfter = await CouponEntity.findOne({ where: { code: 'WELCOME10' } });
    assert.strictEqual(couponAfter?.used_count, usedCountBefore + 1, 'Coupon used_count must increment on checkout');
    console.log('✓ Test 11 Passed: Order created with exact pricing calculations');

    // --- TEST 12: CUSTOMER cannot access another customer's order ---
    console.log('Running Test 12: CUSTOMER cannot access another customer order...');
    const t12 = await apiRequest(`/orders/${orderCreated.id}`, {
      headers: { Authorization: `Bearer ${tokenCust2}` },
    });
    assert.strictEqual(t12.status, 403, 'Expected 403 when Customer 2 accesses Customer 1 order');
    console.log('✓ Test 12 Passed: Customer isolation strictly enforced');

    // --- TEST 13: Customer own order history pagination ---
    console.log('Running Test 13: Paginated customer order history...');
    const t13 = await apiRequest('/orders?page=1&limit=5', {
      headers: { Authorization: `Bearer ${tokenCust1}` },
    });
    assert.strictEqual(t13.status, 200);
    assert.strictEqual(t13.body.data.page, 1);
    assert.strictEqual(t13.body.data.limit, 5);
    assert.ok(t13.body.data.total >= 1);
    assert.ok(t13.body.data.totalPages >= 1);
    assert.ok(Array.isArray(t13.body.data.orders));
    assert.ok(t13.body.data.orders[0].items.length > 0, 'Order items must be preserved in history');
    console.log('✓ Test 13 Passed: Paginated order history returned with metadata and items');

    // --- TEST 14: Admin order viewing ---
    console.log('Running Test 14: Admin/Operations order viewing...');
    const t14List = await apiRequest('/orders/admin?page=1&limit=10', {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert.strictEqual(t14List.status, 200);
    assert.ok(t14List.body.data.orders.length >= 1);

    const t14Detail = await apiRequest(`/orders/admin/${orderCreated.id}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert.strictEqual(t14Detail.status, 200);
    assert.strictEqual(t14Detail.body.data.id, orderCreated.id);
    console.log('✓ Test 14 Passed: Admin can view all orders and specific customer order');

    // --- TEST 15: Failed payment simulation ---
    console.log('Running Test 15: Failed payment simulation...');
    // Create new order for Customer 2 to test payment failure
    let cartCust2 = await CartEntity.findOne({ where: { user_id: customer2.id, is_delete: 0 } });
    if (!cartCust2) {
      cartCust2 = await CartEntity.create({ user_id: customer2.id }).save();
    }
    await CartItemEntity.delete({ cart_id: cartCust2.id });
    await CartItemEntity.create({
      cart_id: cartCust2.id,
      product_id: mainProduct.id,
      quantity: 1,
    }).save();

    const t15Order = await apiRequest('/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCust2}` },
      body: JSON.stringify({ address_id: address2.id }),
    });
    assert.strictEqual(t15Order.status, 200);
    const orderToFail = t15Order.body.data;

    const t15PayFail = await apiRequest(`/payments/${orderToFail.id}/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCust2}` },
      body: JSON.stringify({
        outcome: 'FAILED',
      }),
    });
    assert.strictEqual(t15PayFail.status, 200);
    assert.strictEqual(t15PayFail.body.data.status, PaymentStatus.FAILED);

    const orderAfterFail = await OrderEntity.findOne({ where: { id: orderToFail.id } });
    assert.strictEqual(orderAfterFail?.status, OrderStatus.PAYMENT_FAILED);
    console.log('✓ Test 15 Passed: Payment failure recorded and order transitioned to PAYMENT_FAILED');

    // --- TEST 16: Retry failed payment -> success ---
    console.log('Running Test 16: Retry failed payment -> success...');
    const t16Retry = await apiRequest(`/payments/${orderToFail.id}/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCust2}` },
      body: JSON.stringify({
        outcome: 'SUCCESS',
      }),
    });
    assert.strictEqual(t16Retry.status, 200);
    assert.strictEqual(t16Retry.body.data.status, PaymentStatus.SUCCESS);

    const orderAfterRetry = await OrderEntity.findOne({ where: { id: orderToFail.id } });
    assert.strictEqual(orderAfterRetry?.status, OrderStatus.CONFIRMED);
    console.log('✓ Test 16 Passed: Retry payment succeeded and order transitioned to CONFIRMED');

    // --- TEST 17: Duplicate SUCCESS protection ---
    console.log('Running Test 17: Duplicate successful payment protection...');
    const t17Duplicate = await apiRequest(`/payments/${orderToFail.id}/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCust2}` },
      body: JSON.stringify({
        outcome: 'SUCCESS',
      }),
    });
    assert.strictEqual(t17Duplicate.status, 200);
    assert.strictEqual(t17Duplicate.body.data.id, t16Retry.body.data.id, 'Must return existing payment record');
    const paymentsCount = await PaymentEntity.count({ where: { order_id: orderToFail.id, status: PaymentStatus.SUCCESS } });
    assert.strictEqual(paymentsCount, 1, 'Duplicate success must not create multiple success payments');
    console.log('✓ Test 17 Passed: Duplicate successful payment idempotent');

    // --- TEST 18: Invalid order status transition rejection ---
    console.log('Running Test 18: Invalid order status transition rejection...');
    // orderAfterRetry is CONFIRMED. Trying CONFIRMED -> DELIVERED directly is invalid.
    const t18Invalid = await apiRequest(`/orders/${orderToFail.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ status: OrderStatus.DELIVERED }),
    });
    assert.strictEqual(t18Invalid.status, 400);
    assert.match(t18Invalid.body.message, /invalid order status transition/i);
    console.log('✓ Test 18 Passed: Invalid order status transition rejected with 400');

    // --- TEST 19: Valid status flow: CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED ---
    console.log('Running Test 19: Valid CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED flow...');
    const s1 = await apiRequest(`/orders/${orderToFail.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ status: OrderStatus.PROCESSING }),
    });
    assert.strictEqual(s1.status, 200);
    assert.strictEqual(s1.body.data.status, OrderStatus.PROCESSING);

    const s2 = await apiRequest(`/orders/${orderToFail.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ status: OrderStatus.SHIPPED }),
    });
    assert.strictEqual(s2.status, 200);
    assert.strictEqual(s2.body.data.status, OrderStatus.SHIPPED);

    const s3 = await apiRequest(`/orders/${orderToFail.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ status: OrderStatus.DELIVERED }),
    });
    assert.strictEqual(s3.status, 200);
    assert.strictEqual(s3.body.data.status, OrderStatus.DELIVERED);
    console.log('✓ Test 19 Passed: Complete order status lifecycle succeeded');

    // --- TEST 20: Audit logs recording and retrieval ---
    console.log('Running Test 20: Audit logs recorded and retrievable...');
    const t20Logs = await apiRequest('/audit-logs?page=1&limit=20', {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert.strictEqual(t20Logs.status, 200);
    assert.ok(t20Logs.body.data.auditLogs.length > 0);
    const actions = (t20Logs.body.data.auditLogs as Array<{ action: string }>).map((l) => l.action);
    assert.ok(actions.includes('ORDER_CREATED'), 'Audit log must record ORDER_CREATED');
    assert.ok(actions.includes('ORDER_STATUS_CHANGED'), 'Audit log must record ORDER_STATUS_CHANGED');
    assert.ok(actions.includes('PAYMENT_SUCCESS'), 'Audit log must record PAYMENT_SUCCESS');
    assert.ok(actions.includes('PAYMENT_FAILED'), 'Audit log must record PAYMENT_FAILED');
    console.log('✓ Test 20 Passed: Audit logs recorded all required events and returned paginated');

    // --- TEST 21: Concurrent checkout when stock_quantity = 1 ---
    console.log('Running Test 21: Concurrency - two checkouts simultaneously when stock_quantity = 1...');
    const scarceSku = `SCARCE-${Date.now()}`;
    const scarceProduct = await ProductEntity.create({
      sku: scarceSku,
      name: 'Scarce Item',
      description: 'Only 1 available',
      price: '500.00',
      stock_quantity: 1,
      is_active: true,
      category_id: category.id,
    }).save();

    // Set cart for Customer 1 with quantity 1
    await CartItemEntity.delete({ cart_id: cartCust1.id });
    await CartItemEntity.create({
      cart_id: cartCust1.id,
      product_id: scarceProduct.id,
      quantity: 1,
    }).save();

    // Set cart for Customer 2 with quantity 1
    await CartItemEntity.delete({ cart_id: cartCust2.id });
    await CartItemEntity.create({
      cart_id: cartCust2.id,
      product_id: scarceProduct.id,
      quantity: 1,
    }).save();

    // Trigger concurrent checkouts
    const [resCust1, resCust2] = await Promise.all([
      apiRequest('/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenCust1}` },
        body: JSON.stringify({ address_id: address1.id }),
      }),
      apiRequest('/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenCust2}` },
        body: JSON.stringify({ address_id: address2.id }),
      }),
    ]);

    const results = [resCust1, resCust2];
    const successes = results.filter((r) => r.status === 200);
    const failures = results.filter((r) => r.status === 400);

    assert.strictEqual(successes.length, 1, 'EXACTLY one concurrent checkout must succeed');
    assert.strictEqual(failures.length, 1, 'EXACTLY one concurrent checkout must fail');
    assert.match(failures[0].body.message, /insufficient stock/i, 'Failed checkout must report insufficient stock');

    const scarceAfter = await ProductEntity.findOne({ where: { id: scarceProduct.id } });
    assert.strictEqual(scarceAfter?.stock_quantity, 0, 'Final stock quantity must be exactly 0');
    console.log('✓ Test 21 Passed: Concurrency lock successfully allowed only 1 order and left stock at 0');

    // --- TEST 22: Transaction rollback on failure ---
    console.log('Running Test 22: Transaction rollback consistency...');
    const orderItemsWithScarce = await OrderItemEntity.find({ where: { product_sku: scarceSku } });
    assert.strictEqual(orderItemsWithScarce.length, 1, 'Only the successful checkout created an order item');
    console.log('✓ Test 22 Passed: Transaction rollback ensured complete database consistency');

    console.log('\n========================================');
    console.log(' ALL 22 AUTOMATED TESTS PASSED SUCCESSFULLY! ');
    console.log('========================================\n');
  } finally {
    server.close();
  }
}

runTestSuite()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('TEST SUITE FAILED WITH ERROR:', err);
    process.exit(1);
  });
