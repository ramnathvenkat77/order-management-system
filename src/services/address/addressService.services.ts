import { BaseServices } from '../baseService.services';

import { AddressEntity } from '../../entities/addressEntity';

import {
  AddressModel,
} from '../../database/repository/address/address.model';

import {
  CreateAddressDto,
  UpdateAddressDto,
} from '../../database/repository/address/address.dto';

import {
  NotFoundError,
} from '../../core/ApiError';

class AddressService extends BaseServices<
  AddressModel,
  CreateAddressDto
> {
  public getModel(): AddressModel {
    return new AddressModel();
  }

  public getDTO(): new () => CreateAddressDto {
    return CreateAddressDto;
  }

  public getModuleName(): string {
    return 'Address';
  }

  public async getAddresses(
    userId: number
  ): Promise<AddressModel[]> {
    const addresses =
      await AddressEntity.find({
        where: {
          user_id: userId,
          is_delete: 0,
        },
        order: {
          id: 'ASC',
        },
      });

    return addresses.map(
      (address) =>
        this.toModel(address)
    );
  }

  public async createAddress(
    userId: number,
    dto: CreateAddressDto
  ): Promise<AddressModel> {
    if (dto.is_default === true) {
      await this.removeExistingDefault(
        userId
      );
    }

    const address =
      AddressEntity.create({
        user_id: userId,

        line1: dto.line1.trim(),

        line2:
          dto.line2?.trim() || null,

        city: dto.city.trim(),

        state: dto.state.trim(),

        postal_code:
          dto.postal_code.trim(),

        country: dto.country.trim(),

        is_default:
          dto.is_default ?? false,
      });

    const savedAddress =
      await address.save();

    return this.toModel(
      savedAddress
    );
  }

  public async updateAddress(
    userId: number,
    addressId: number,
    dto: UpdateAddressDto
  ): Promise<AddressModel> {
    const address =
      await this.findOwnedAddress(
        userId,
        addressId
      );

    if (dto.is_default === true) {
      await this.removeExistingDefault(
        userId
      );
    }

    if (dto.line1 !== undefined) {
      address.line1 =
        dto.line1.trim();
    }

    if (dto.line2 !== undefined) {
      address.line2 =
        dto.line2.trim() || null;
    }

    if (dto.city !== undefined) {
      address.city =
        dto.city.trim();
    }

    if (dto.state !== undefined) {
      address.state =
        dto.state.trim();
    }

    if (
      dto.postal_code !== undefined
    ) {
      address.postal_code =
        dto.postal_code.trim();
    }

    if (dto.country !== undefined) {
      address.country =
        dto.country.trim();
    }

    if (
      dto.is_default !== undefined
    ) {
      address.is_default =
        dto.is_default;
    }

    const savedAddress =
      await address.save();

    return this.toModel(
      savedAddress
    );
  }

  public async deleteAddress(
    userId: number,
    addressId: number
  ): Promise<void> {
    const address =
      await this.findOwnedAddress(
        userId,
        addressId
      );

    address.is_delete = 1;

    address.is_default = false;

    await address.save();
  }

  private async findOwnedAddress(
    userId: number,
    addressId: number
  ): Promise<AddressEntity> {
    const address =
      await AddressEntity.findOne({
        where: {
          id: addressId,
          user_id: userId,
          is_delete: 0,
        },
      });

    if (!address) {
      throw new NotFoundError(
        'Address not found'
      );
    }

    return address;
  }

  private async removeExistingDefault(
    userId: number
  ): Promise<void> {
    await AddressEntity.update(
      {
        user_id: userId,
        is_delete: 0,
        is_default: true,
      },
      {
        is_default: false,
      }
    );
  }

  private toModel(
    address: AddressEntity
  ): AddressModel {
    const model =
      new AddressModel();

    model.id = address.id;

    model.user_id =
      address.user_id;

    model.line1 =
      address.line1;

    model.line2 =
      address.line2;

    model.city =
      address.city;

    model.state =
      address.state;

    model.postal_code =
      address.postal_code;

    model.country =
      address.country;

    model.is_default =
      address.is_default;

    return model;
  }
}

export default AddressService;