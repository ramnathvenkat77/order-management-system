import { InferModel } from '../InferModel/InferModel.model';

import {
  DeliveryAddressSnapshot,
  OrderStatus,
} from '../../../entities/orderEntity';

export class OrderItemModel extends InferModel {
  order_id: number = 0;

  product_id: number | null = null;

  product_sku: string = '';

  product_name: string = '';

  unit_price: string = '0.00';

  quantity: number = 0;

  line_total: string = '0.00';
}

export class OrderModel extends InferModel {
  order_number: string = '';

  user_id: number = 0;

  address_id: number | null = null;

  delivery_address: DeliveryAddressSnapshot = {
    line1: '',
    line2: null,
    city: '',
    state: '',
    postal_code: '',
    country: '',
  };

  coupon_id: number | null = null;

  subtotal: string = '0.00';

  discount_amount: string = '0.00';

  tax_amount: string = '0.00';

  shipping_amount: string = '0.00';

  grand_total: string = '0.00';

  status: OrderStatus =
    OrderStatus.PENDING_PAYMENT;

  items: OrderItemModel[] = [];
}