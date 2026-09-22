import { InferModel } from '../InferModel/InferModel.model';

export class AddressModel extends InferModel {
  user_id: number = 0;

  line1: string = '';

  line2: string | null = null;

  city: string = '';

  state: string = '';

  postal_code: string = '';

  country: string = '';

  is_default: boolean = false;
}