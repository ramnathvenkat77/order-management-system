import express from 'express';

import { APP_ROUTES } from '../core/AppRoutes';
import { InferModel } from '../database/repository/InferModel/InferModel.model';
import { BaseServices } from '../services/baseService.services';

export abstract class BaseController {
  protected dto: new () => object;

  constructor(
    protected path: APP_ROUTES,
    public router = express.Router(),
    public service: BaseServices<InferModel, object>
  ) {
    this.dto = this.service.getDTO();

    this._initialiseRoutes();
  }

  public abstract _initialiseRoutes(): void;
}