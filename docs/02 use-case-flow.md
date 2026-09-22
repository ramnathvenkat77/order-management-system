# Use-Case Flow Description

## Actors

The Order Management System has three main actors:

- Customer
- Admin
- Operations

## 1. Customer Use Cases

A Customer can:

- Register an account
- Login
- View their profile
- Browse products
- Search and filter products
- View product details
- Add products to cart
- Update cart quantity
- Remove products from cart
- View cart totals
- Create delivery addresses
- Update their own addresses
- Delete their own addresses
- Select a delivery address
- Apply and validate a coupon
- Place an order
- Make a simulated payment
- View their own orders
- View order details
- Track order status
## 2. Admin Use Cases

An Admin can:

- Login
- Create products
- Update products
- Deactivate products
- Manage categories
- Manage coupons
- Manage inventory
- View and manage permitted system data
- View permitted order information
- View audit logs

Admin users must follow server-side authorization rules and can only perform actions allowed by the defined Admin role.
## 3. Operations Use Cases

An Operations user can:

- Login
- View permitted orders
- Process confirmed orders
- Update fulfillment-related order statuses

Operations users must follow valid order status transitions.

Example fulfillment flow:

CONFIRMED  
↓  
PROCESSING  
↓  
SHIPPED  
↓  
DELIVERED

Operations users must not move an order directly to an invalid or arbitrary status.

## 4. Customer Order Flow

Register  
↓  
Login  
↓  
Receive authentication token  
↓  
Browse Products  
↓  
Add Products to Cart  
↓  
Update or Remove Cart Items  
↓  
Select or Create Delivery Address  
↓  
Apply Coupon (Optional)  
↓  
System Validates Coupon and Calculates Discount  
↓  
Checkout  
↓  
System Re-checks Product Availability, Product Status, Current Pricing, Cart Validity and Coupon Rules  
↓  
Create Order  
↓  
Store Order Item Snapshots  
↓  
Update or Reserve Inventory  
↓  
Create Payment Attempt  
↓  
Payment SUCCESS / FAILED  
↓  
If Successful, Order Moves Forward  
↓  
Operations Processes Order  
↓  
Customer Views Order Status and History  
↓  
Important Actions Are Recorded in Audit Logs