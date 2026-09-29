import { InferModel } from '../InferModel/InferModel.model';

export class AuditLogModel extends InferModel {
  user_id: number | null = null;
  action: string = '';
  entity_type: string = '';
  entity_id: string | null = null;
  metadata: Record<string, unknown> | null = null;
  created_at: Date = new Date();
}
