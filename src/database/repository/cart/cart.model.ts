import { InferModel } from '../InferModel/InferModel.model';

export class CartItemModel extends InferModel {
  product_id: number = 0;
  product_name: string = '';
  product_sku: string = '';
  unit_price: string = '0.00';
  quantity: number = 0;
  line_total: string = '0.00';
}

export class CartModel extends InferModel {
  user_id: number = 0;
  items: CartItemModel[] = [];
  subtotal: string = '0.00';
}