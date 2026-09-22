# Requirement Understanding and Assumptions

## 1. Requirement Understanding

The objective of this project is to build a production-style Order Management System backend using Node.js and TypeScript.

The system will support three main roles:

- Customer
- Admin
- Operations

### Customer

A Customer should be able to:

- Register
- Login
- Browse products
- Search and filter products
- View product details
- Add products to cart
- Update cart quantities
- Remove products from cart
- Manage delivery addresses
- Apply coupons
- Place an order
- Make a simulated payment
- View their own orders
- Track order status

### Admin

An Admin should be able to:

- Manage products
- Manage categories
- Manage coupons
- Manage inventory
- View and manage permitted system data
- Access audit logs

### Operations

An Operations user should be able to:

- View permitted orders
- Process orders
- Update fulfillment-related order statuses

## 2. Product Requirements

Each product must have:

- A unique SKU
- Name
- Description
- Price
- Category
- Stock quantity
- Active or inactive status

Inactive products must not be available for new purchases.

The backend must be responsible for the actual product price and inventory values. The client must not be allowed to send or control authoritative checkout prices or stock quantities.

Inventory must never become negative.

## 3. Cart Requirements

Each customer will have an active cart.

A customer can:

- Add products to the cart
- Update item quantity
- Remove items
- View cart totals

Cart quantity must be a positive integer.

Adding an item to the cart should validate whether the product exists and can be purchased.

The system must validate the cart again during checkout.

## 4. Address Requirements

Customers can:

- Create addresses
- Update their own addresses
- Delete their own addresses
- Select a default address

Customers must not be able to use another customer's address.

The order must preserve the required delivery address information.

## 5. Coupon Requirements

The system must support:

- Percentage-based coupons
- Fixed-amount coupons

Coupons may include:

- Start date
- Expiry date
- Minimum order value
- Maximum discount
- Total usage limit
- Active or inactive status

Invalid, expired, inactive, or exhausted coupons must be rejected.

Coupon discounts must always be calculated by the server.

## 6. Order Requirements

An order cannot be created from an empty cart.

Only the authenticated customer can create an order using their own cart.

The server will calculate:

- Product prices
- Discount
- Tax
- Shipping
- Final order total
- Inventory changes

Order items must preserve product information such as:

- Product name
- SKU
- Unit price

The customer should only be able to view their own orders.

Order history should support pagination.

## 7. Payment Requirements

The first version of the project will use a simulated payment provider.

A payment attempt must be linked to an order.

The payment can have two outcomes:

- SUCCESS
- FAILED

The payment amount must match the amount calculated by the server.

Duplicate payment callbacks or events must not create duplicate business effects.

Real card numbers or sensitive payment information must not be stored.

## 8. Order Status Lifecycle

The order should follow valid status transitions.

Possible statuses include:

- PENDING_PAYMENT
- PAYMENT_FAILED
- CONFIRMED
- PROCESSING
- SHIPPED
- DELIVERED
- CANCELLED
- REFUNDED

The client must not be allowed to change an order directly to any arbitrary status.

## 9. Authentication and Authorization

The system must:

- Hash passwords before storing them
- Validate login credentials
- Protect authenticated endpoints
- Enforce role-based access
- Restrict customers to their own resources

Sensitive credentials and tokens must not appear in application logs.

## 10. Checkout and Inventory Consistency

During checkout, the system must re-check:

- Product availability
- Product status
- Current pricing
- Cart validity
- Coupon validity
- Inventory availability

If two customers attempt to purchase the final available unit of the same product at the same time, the system must ensure that both purchases cannot succeed.

A database transaction or similar consistency strategy will be used during checkout to prevent overselling and partial order creation.

## 11. Error Handling

The system should handle errors such as:

- Duplicate registration email
- Invalid login
- Unauthenticated request
- Unauthorized access
- Resource not found
- Invalid product
- Inactive product
- Invalid quantity
- Insufficient inventory
- Invalid coupon
- Expired coupon
- Coupon usage limit exceeded
- Invalid order status transition
- Payment failure
- Duplicate payment callback
- Database or transaction failure
- Unexpected server error

## 12. Assumptions

The following assumptions will be used where the project specification does not define an exact rule:

1. New users registering through the public registration API will receive the CUSTOMER role.
2. ADMIN and OPERATIONS accounts will be created separately and will not use normal customer registration.
3. Adding a product to the cart will not permanently reserve inventory.
4. Inventory will be validated again when checkout occurs.
5. Checkout will use a database transaction or locking strategy to avoid overselling.
6. Successful payment will move an order forward from PENDING_PAYMENT.
7. Failed payment will move the order to PAYMENT_FAILED.
8. Order items will store purchase-time product information so that old orders are not affected when product information changes later.
9. Tax rules will be defined before implementation because the specification does not provide an exact tax formula.
10. Shipping rules will be defined before implementation because the specification does not provide an exact shipping formula.
11. Discounts, tax, shipping, and final totals will always be calculated by the backend.
12. The final payable amount must never become negative.
13. Protected endpoints will require authentication.
14. Role permissions will always be enforced on the server.
15. Important business actions will be recorded in audit logs.
16. Non-critical notifications may be processed asynchronously.
17. API endpoints will follow the `/api/v1` versioning format.
18. No secrets, passwords, tokens, or payment credentials will be committed to the source code.