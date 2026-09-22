import { In } from 'typeorm';

import { BaseServices } from '../baseService.services';

import {
  CartItemModel,
  CartModel,
} from '../../database/repository/cart/cart.model';

import {
  AddCartItemDto,
} from '../../database/repository/cart/cart.dto';

import { CartEntity } from '../../entities/cartEntity';
import { CartItemEntity } from '../../entities/cartItemEntity';
import { ProductEntity } from '../../entities/productEntity';

import {
  BadRequestError,
  NotFoundError,
} from '../../core/ApiError';

class CartService extends BaseServices<
  CartModel,
  AddCartItemDto
> {
  public getModel(): CartModel {
    return new CartModel();
  }

  public getDTO(): new () => AddCartItemDto {
    return AddCartItemDto;
  }

  public getModuleName(): string {
    return 'Cart';
  }

  public async getCart(
    userId: number
  ): Promise<CartModel> {
    const cart =
      await this.getOrCreateCart(userId);

    return this.buildCartModel(cart);
  }

  public async addItem(
    userId: number,
    productId: number,
    quantity: number
  ): Promise<CartModel> {
    this.validateQuantity(quantity);

    const cart =
      await this.getOrCreateCart(userId);

    const product =
      await this.getPurchasableProduct(
        productId
      );

    const existingItem =
      await CartItemEntity.findOne({
        where: {
          cart_id: cart.id,
          product_id: product.id,
        },
      });

    let finalQuantity = quantity;

    if (
      existingItem &&
      existingItem.is_delete === 0
    ) {
      finalQuantity =
        existingItem.quantity + quantity;
    }

    this.validateAvailableStock(
      finalQuantity,
      product.stock_quantity
    );

    if (existingItem) {
      existingItem.quantity =
        finalQuantity;

      existingItem.is_delete = 0;

      await existingItem.save();
    } else {
      const cartItem =
        CartItemEntity.create({
          cart_id: cart.id,
          product_id: product.id,
          quantity: finalQuantity,
        });

      await cartItem.save();
    }

    return this.buildCartModel(cart);
  }

  public async updateItem(
    userId: number,
    itemId: number,
    quantity: number
  ): Promise<CartModel> {
    this.validateQuantity(quantity);

    const cart =
      await this.getOrCreateCart(userId);

    const cartItem =
      await CartItemEntity.findOne({
        where: {
          id: itemId,
          cart_id: cart.id,
          is_delete: 0,
        },
      });

    if (!cartItem) {
      throw new NotFoundError(
        'Cart item not found'
      );
    }

    const product =
      await this.getPurchasableProduct(
        cartItem.product_id
      );

    this.validateAvailableStock(
      quantity,
      product.stock_quantity
    );

    cartItem.quantity = quantity;

    await cartItem.save();

    return this.buildCartModel(cart);
  }

  public async removeItem(
    userId: number,
    itemId: number
  ): Promise<CartModel> {
    const cart =
      await this.getOrCreateCart(userId);

    const cartItem =
      await CartItemEntity.findOne({
        where: {
          id: itemId,
          cart_id: cart.id,
          is_delete: 0,
        },
      });

    if (!cartItem) {
      throw new NotFoundError(
        'Cart item not found'
      );
    }

    cartItem.is_delete = 1;

    await cartItem.save();

    return this.buildCartModel(cart);
  }

  private async getOrCreateCart(
    userId: number
  ): Promise<CartEntity> {
    let cart =
      await CartEntity.findOne({
        where: {
          user_id: userId,
          is_delete: 0,
        },
      });

    if (!cart) {
      cart = CartEntity.create({
        user_id: userId,
      });

      cart = await cart.save();
    }

    return cart;
  }

  private async getPurchasableProduct(
    productId: number
  ): Promise<ProductEntity> {
    const product =
      await ProductEntity.findOne({
        where: {
          id: productId,
          is_delete: 0,
          is_active: true,
        },
      });

    if (!product) {
      throw new BadRequestError(
        'Product does not exist or is inactive'
      );
    }

    return product;
  }

  private validateQuantity(
    quantity: number
  ): void {
    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw new BadRequestError(
        'Quantity must be a positive integer'
      );
    }
  }

  private validateAvailableStock(
    quantity: number,
    availableStock: number
  ): void {
    if (quantity > availableStock) {
      throw new BadRequestError(
        'Requested quantity exceeds available stock'
      );
    }
  }

  private async buildCartModel(
    cart: CartEntity
  ): Promise<CartModel> {
    const cartItems =
      await CartItemEntity.find({
        where: {
          cart_id: cart.id,
          is_delete: 0,
        },
        order: {
          id: 'ASC',
        },
      });

    const productIds =
      cartItems.map(
        (item) => item.product_id
      );

    const products =
      productIds.length > 0
        ? await ProductEntity.find({
            where: {
              id: In(productIds),
            },
          })
        : [];

    const productMap =
      new Map(
        products.map(
          (product) => [
            product.id,
            product,
          ]
        )
      );

    const model =
      this.getModel();

    model.id = cart.id;
    model.user_id = cart.user_id;

    let subtotalInCents = 0;

    model.items =
      cartItems
        .map(
          (
            item
          ): CartItemModel | null => {
            const product =
              productMap.get(
                item.product_id
              );

            if (!product) {
              return null;
            }

            const itemModel =
              new CartItemModel();

            const unitPriceInCents =
              this.toCents(
                product.price
              );

            const lineTotalInCents =
              unitPriceInCents *
              item.quantity;

            itemModel.id = item.id;

            itemModel.product_id =
              product.id;

            itemModel.product_name =
              product.name;

            itemModel.product_sku =
              product.sku;

            itemModel.unit_price =
              this.formatMoney(
                unitPriceInCents
              );

            itemModel.quantity =
              item.quantity;

            itemModel.line_total =
              this.formatMoney(
                lineTotalInCents
              );

            subtotalInCents +=
              lineTotalInCents;

            return itemModel;
          }
        )
        .filter(
          (
            item
          ): item is CartItemModel =>
            item !== null
        );

    model.subtotal =
      this.formatMoney(
        subtotalInCents
      );

    return model;
  }

  private toCents(
    amount: string
  ): number {
    return Math.round(
      Number(amount) * 100
    );
  }

  private formatMoney(
    amountInCents: number
  ): string {
    return (
      amountInCents / 100
    ).toFixed(2);
  }
}


export default CartService;