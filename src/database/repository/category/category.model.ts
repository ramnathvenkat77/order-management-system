import { InferModel } from '../InferModel/InferModel.model';

export class CategoryModel extends InferModel {
  name: string = '';
  description: string | null = null;
  is_active: boolean = true;
}