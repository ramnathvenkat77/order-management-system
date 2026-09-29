import { BaseServices } from '../baseService.services';
import { InferModel } from '../../database/repository/InferModel/InferModel.model';
import Database from '../../database/database';

export class HealthModel extends InferModel {
  apiStatus: string = 'healthy';
  databaseStatus: string = 'connected';
  timestamp: string = new Date().toISOString();
}

export class HealthService extends BaseServices<HealthModel, object> {
  private database = Database.getInstance();

  public getModel(): HealthModel {
    return new HealthModel();
  }

  public getDTO(): new () => object {
    return Object;
  }

  public getModuleName(): string {
    return 'Health';
  }

  public async checkHealth(): Promise<{
    apiStatus: string;
    databaseStatus: string;
    timestamp: string;
  }> {
    const timestamp = new Date().toISOString();
    let databaseStatus: string;

    try {
      await this.database.executeExternalQuery('SELECT 1');
      databaseStatus = 'connected';
    } catch {
      databaseStatus = 'disconnected';
    }

    return {
      apiStatus: databaseStatus === 'connected' ? 'healthy' : 'unhealthy',
      databaseStatus,
      timestamp,
    };
  }
}

export default HealthService;
