import { InferModel } from '../InferModel/InferModel.model';

import {
  PaymentStatus,
} from '../../../entities/paymentEntity';

export class PaymentModel extends InferModel {
  order_id: number = 0;

  amount: string = '0.00';

  status: PaymentStatus =
    PaymentStatus.PENDING;

  provider: string = '';

  provider_reference: string = '';
}