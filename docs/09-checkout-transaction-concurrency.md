# Checkout Transaction and Concurrency Strategy

This document describes the proposed database transaction strategy for checkout and inventory consistency.

## Problem

Consider this situation:

Product A has stock = 1.

Customer A and Customer B both try to purchase Product A at almost the same time.

Without proper concurrency handling, both requests could read:

Stock = 1

and both could successfully create orders.

This would result in overselling.

The system must ensure that only one customer can successfully purchase the final unit.

## Proposed Strategy

Checkout will use a database transaction.

The general flow will be:

```text
Begin Transaction
        ↓
Load Cart
        ↓
Validate Cart
        ↓
Lock Required Product Inventory Rows
        ↓
Check Current Stock
        ↓
Check Current Product Price and Status
        ↓
Validate Coupon
        ↓
Calculate Final Total
        ↓
Create Order
        ↓
Create Order Items
        ↓
Reduce Inventory
        ↓
Create Payment Attempt
        ↓
Commit Transaction
```

If any critical step fails:

```text
Failure
   ↓
Rollback Transaction
```

## Inventory Locking

During checkout, the inventory rows for the products being purchased will be locked inside the transaction.

Conceptually:

```text
SELECT product
FOR UPDATE
```

The exact SQL and implementation will depend on the database library selected during implementation.

The purpose of the lock is to prevent two checkout transactions from updating the same inventory at the same time.

## Example

Initial stock:

```text
Product A = 1
```

Customer A starts checkout.

The transaction locks Product A.

Customer B also starts checkout but must wait for the inventory row to become available.

Customer A checks stock:

```text
Stock = 1
```

Customer A successfully creates the order and reduces stock:

```text
Stock = 0
```

Customer A commits the transaction.

Customer B can now continue.

Customer B checks the latest stock:

```text
Stock = 0
```

The system rejects Customer B's checkout with:

```text
INSUFFICIENT_INVENTORY
```

Therefore, only one customer successfully purchases the final unit.

## Transaction Responsibilities

The following critical operations should happen within the checkout transaction:

- Re-check current inventory
- Validate current product status
- Use current server-side product price
- Create the order
- Create order-item snapshots
- Update or reserve inventory
- Create the required payment attempt record

If one of these critical database operations fails, the transaction should be rolled back.

## Order Item Snapshot

Order items must store purchase-time information such as:

- Product name
- SKU
- Unit price
- Quantity

This ensures that an old order remains correct even if the product name or price changes later.

## Rollback Example

Suppose:

1. Inventory is available.
2. Order is created.
3. Order items are created.
4. Inventory is reduced.
5. A critical database operation fails before checkout completes.

The transaction should be rolled back.

This prevents the system from leaving a partial checkout state such as:

```text
Order created
but
Inventory update incomplete
```

or:

```text
Inventory reduced
but
Order not properly created
```

## Server-Side Authority

The client must not decide:

- Product price
- Available stock
- Discount
- Tax
- Shipping
- Final payable amount

These values must be validated or calculated by the backend during checkout.

## Important Rules

- Inventory must never become negative.
- Checkout must perform fresh validation.
- Adding an item to the cart does not guarantee that stock will still be available during checkout.
- Concurrent checkout requests must not oversell inventory.
- Critical checkout database operations must be atomic.
- Failed transactions must be rolled back.
- Order totals must be calculated from server-controlled values.