import { InferModel } from '../database/repository/InferModel/InferModel.model';

export abstract class BaseServices<
  TModel extends InferModel,
  TDto
> {
  public abstract getModel(): TModel;

  public abstract getDTO(): new () => TDto;

  public getModuleName(): string {
    return '';
  }
}