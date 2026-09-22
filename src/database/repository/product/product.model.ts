import { InferModel } from '../InferModel/InferModel.model';

export class ProductModel extends InferModel {
  sku: string = '';
  name: string = '';
  description: string | null = null;

  price: string = '0.00';

  stock_quantity: number = 0;

  is_active: boolean = true;

  category_id: number = 0;
}