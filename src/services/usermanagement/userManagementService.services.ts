import { BaseServices } from '../baseService.services';

import {
  UserManagementModel,
} from '../../database/repository/userManagement/userManagement.model';

import {
  UserManagementDto,
} from '../../database/repository/userManagement/userManagement.dto';

import {
  UsersEntity,
} from '../../entities/usersEntity';

import {
  NotFoundError,
} from '../../core/ApiError';

class UserManagementService extends BaseServices<
  UserManagementModel,
  UserManagementDto
> {
  public getModel(): UserManagementModel {
    return new UserManagementModel();
  }

  public getDTO(): new () => UserManagementDto {
    return UserManagementDto;
  }

  public getModuleName(): string {
    return 'User Management';
  }

  public async getCurrentUser(
    userId: number
  ): Promise<UserManagementModel> {
    const user = await UsersEntity.findOne({
      where: {
        id: userId,
        is_delete: 0,
      },
    });

    if (!user) {
      throw new NotFoundError(
        'User not found'
      );
    }

    const model = this.getModel();

    model.id = user.id;
    model.name = user.name;
    model.email = user.email;
    model.role = user.role;
    model.status = user.status;

    return model;
  }
}

export default UserManagementService;