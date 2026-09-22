import { InferModel } from '../InferModel/InferModel.model';

export class AuthModel extends InferModel {
  name: string = '';
  email: string = '';
  password: string = '';
}