import { InferModel } from '../InferModel/InferModel.model';

import {
  UserRole,
  UserStatus,
} from '../../../entities/usersEntity';

export class UserManagementModel extends InferModel {
  name: string = '';
  email: string = '';
  role: UserRole = UserRole.CUSTOMER;
  status: UserStatus = UserStatus.ACTIVE;
}