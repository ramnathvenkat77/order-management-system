import {
  DataSource,
  EntityManager,
} from 'typeorm';

import {
  getPostgresConnection,
} from './data-source';

class Database {
  private static instance: Database;

  private postgresConnection:
    DataSource | null = null;

  private entityManager:
    EntityManager | null = null;

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance =
        new Database();
    }

    return Database.instance;
  }

  async connectToDB(): Promise<void> {
    if (!this.postgresConnection) {
      this.postgresConnection =
        getPostgresConnection();

      try {
        await this.postgresConnection
          .initialize();

        this.entityManager =
          this.postgresConnection
            .manager;

        console.log(
          `Connected to PostgreSQL database: ${process.env.DB_DATABASE}`
        );
      } catch (error) {
        console.error(
          'Error connecting to PostgreSQL:',
          error
        );

        throw error;
      }
    }
  }

  public async runInTransaction<T>(
    work: (
      manager: EntityManager
    ) => Promise<T>
  ): Promise<T> {
    if (
      !this.postgresConnection ||
      !this.postgresConnection
        .isInitialized
    ) {
      throw new Error(
        'Database connection not established'
      );
    }

    return this.postgresConnection
      .transaction(
        async (manager) => {
          return work(manager);
        }
      );
  }

  public async executeExternalQuery(
    query: string,
    params: unknown[] = []
  ): Promise<unknown> {
    if (!this.entityManager) {
      throw new Error(
        'Database connection not established'
      );
    }
 
    try {
      const result =
        await this.entityManager.query(
          query,
          params
        );

      return result;
    } catch (error) {
      console.error(
        'Error executing query:',
        error
      );

      throw error;
    }
  }
}

export default Database;