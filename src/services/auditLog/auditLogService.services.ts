import { EntityManager } from 'typeorm';
import { BaseServices } from '../baseService.services';
import { AuditLogModel } from '../../database/repository/auditLog/auditLog.model';
import { CreateAuditLogDto } from '../../database/repository/auditLog/auditLog.dto';
import { AuditLogEntity } from '../../entities/auditLogEntity';

export interface PaginatedAuditLogsResponse {
  auditLogs: AuditLogModel[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class AuditLogService extends BaseServices<
  AuditLogModel,
  CreateAuditLogDto
> {
  public getModel(): AuditLogModel {
    return new AuditLogModel();
  }

  public getDTO(): new () => CreateAuditLogDto {
    return CreateAuditLogDto;
  }

  public getModuleName(): string {
    return 'AuditLog';
  }

  public async recordAuditLog(
    params: {
      userId?: number | null;
      action: string;
      entityType: string;
      entityId?: string | number | null;
      metadata?: Record<string, unknown> | null;
    },
    manager?: EntityManager
  ): Promise<AuditLogModel> {
    const logEntity = new AuditLogEntity();
    logEntity.user_id = params.userId ?? null;
    logEntity.action = params.action;
    logEntity.entity_type = params.entityType;
    logEntity.entity_id =
      params.entityId !== undefined && params.entityId !== null
        ? String(params.entityId)
        : null;
    logEntity.metadata = params.metadata ?? null;

    let savedLog: AuditLogEntity;

    if (manager) {
      savedLog = await manager.save(AuditLogEntity, logEntity);
    } else {
      savedLog = await logEntity.save();
    }

    return this.toModel(savedLog);
  }

  public async getAuditLogs(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedAuditLogsResponse> {
    const skip = (page - 1) * limit;

    const [logs, total] = await AuditLogEntity.findAndCount({
      where: {
        is_delete: 0,
      },
      order: {
        id: 'DESC',
      },
      skip,
      take: limit,
    });

    const items = logs.map((log) => this.toModel(log));

    return {
      auditLogs: items,
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  private toModel(log: AuditLogEntity): AuditLogModel {
    const model = new AuditLogModel();
    model.id = log.id;
    model.user_id = log.user_id;
    model.action = log.action;
    model.entity_type = log.entity_type;
    model.entity_id = log.entity_id;
    model.metadata = log.metadata;
    model.created_at = log.created_at;
    return model;
  }
}

export default AuditLogService;
