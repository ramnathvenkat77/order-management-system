import express from 'express';
import { BaseController } from '../baseController.controller';
import { APP_ROUTES } from '../../core/AppRoutes';
import AuditLogService from '../../services/auditLog/auditLogService.services';
import authMiddleware from '../../middlewares/authMiddleware';
import { authorizeRoles } from '../../middlewares/roleMiddleware';
import { UserRole } from '../../entities/usersEntity';
import { SuccessResponse } from '../../core/ApiResponse';
import { ApiError, BadRequestError, InternalError } from '../../core/ApiError';

export class AuditLogController extends BaseController {
  constructor(
    protected path: APP_ROUTES = APP_ROUTES.AUDIT_LOGS,
    public router = express.Router(),
    public service: AuditLogService = new AuditLogService()
  ) {
    super(path, router, service);
  }

  public _initialiseRoutes(): void {
    this.router.get(
      this.path,
      authMiddleware,
      authorizeRoles(UserRole.ADMIN, UserRole.OPERATIONS),
      this.getAuditLogs.bind(this)
    );
  }

  private async getAuditLogs(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const { page, limit } = this.parsePaginationParams(req);

      const result = await this.service.getAuditLogs(page, limit);

      new SuccessResponse('Audit logs fetched successfully', result).send(res);
    } catch (error) {
      this.handleControllerError(error, res);
    }
  }

  private parsePaginationParams(
    req: express.Request
  ): { page: number; limit: number } {
    let page = 1;
    let limit = 10;

    if (req.query.page !== undefined) {
      const parsedPage = Number(req.query.page);
      if (!Number.isInteger(parsedPage) || parsedPage <= 0) {
        throw new BadRequestError('Invalid page number');
      }
      page = parsedPage;
    }

    if (req.query.limit !== undefined) {
      const parsedLimit = Number(req.query.limit);
      if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
        throw new BadRequestError('Invalid limit number');
      }
      if (parsedLimit > 100) {
        throw new BadRequestError('Limit cannot exceed 100');
      }
      limit = parsedLimit;
    }

    return { page, limit };
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

export default AuditLogController;
