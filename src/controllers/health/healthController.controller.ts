import express from 'express';
import { BaseController } from '../baseController.controller';
import { APP_ROUTES } from '../../core/AppRoutes';
import HealthService from '../../services/health/healthService.services';
import { SuccessResponse } from '../../core/ApiResponse';
import { ApiError, InternalError } from '../../core/ApiError';

export class HealthController extends BaseController {
  constructor(
    protected path: APP_ROUTES = APP_ROUTES.HEALTH,
    public router = express.Router(),
    public service: HealthService = new HealthService()
  ) {
    super(path, router, service);
  }

  public _initialiseRoutes(): void {
    this.router.get(this.path, this.getHealth.bind(this));
  }

  private async getHealth(
    _req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const health = await this.service.checkHealth();

      if (health.databaseStatus !== 'connected') {
        res.status(503).json({
          statusCode: '10001',
          message: 'Service Unavailable: Database connection failed',
          data: health,
        });
        return;
      }

      new SuccessResponse('Health status fetched successfully', health).send(
        res
      );
    } catch (error) {
      this.handleControllerError(error, res);
    }
  }

  private handleControllerError(
    error: unknown,
    res: express.Response
  ): void {
    if (error instanceof ApiError) {
      ApiError.handle(error, res);
      return;
    }

    console.error(error);
    ApiError.handle(new InternalError('Something went wrong'), res);
  }
}
