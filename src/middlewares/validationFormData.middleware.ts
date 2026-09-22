import { plainToInstance } from 'class-transformer';
import {
  validate,
  ValidationError,
} from 'class-validator';
import {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';

import {
  ApiError,
  BadRequestError,
} from '../core/ApiError';

function validationFDMiddleware<T extends object>(
  type: new () => T,
  skipMissingProperties = false
): RequestHandler {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const instance = plainToInstance(
        type,
        req.body
      );

      const errors = await validate(
        instance,
        {
          skipMissingProperties,
          whitelist: true,
          forbidNonWhitelisted: true,
        }
      );

      if (errors.length > 0) {
        const message = errors
          .map(
            (error: ValidationError) => {
              const constraints =
                Object.values(
                  error.constraints ?? {}
                );

              return `${error.property}: ${constraints.join(
                '. '
              )}`;
            }
          )
          .join(', ');

        ApiError.handle(
          new BadRequestError(message),
          res
        );

        return;
      }

      req.body = instance;

      next();
    } catch (error) {
      console.error(
        'Validation middleware error:',
        error
      );

      ApiError.handle(
        new BadRequestError(
          'Invalid request data'
        ),
        res
      );
    }
  };
}

export default validationFDMiddleware;