import 'reflect-metadata';
import 'dotenv/config';
import MigrationDataSource from './migration-data-source';

async function run(): Promise<void> {
  try {
    console.log('Database Configuration:');
    console.log('DB_HOST:', process.env.DB_HOST || '127.0.0.1');
    console.log('DB_PORT:', process.env.DB_PORT || 5432);
    console.log('DB_USERNAME:', process.env.DB_USERNAME || 'postgres');
    console.log('DB_DATABASE:', process.env.DB_DATABASE || 'order_management');

    console.log('Initializing DataSource for migrations...');
    await MigrationDataSource.initialize();
    console.log('Running migrations...');
    const migrations = await MigrationDataSource.runMigrations();
    if (migrations.length === 0) {
      console.log('No pending migrations to run.');
    } else {
      console.log(
        `Successfully executed ${migrations.length} migration(s):`,
        migrations.map((m) => m.name)
      );
    }
    await MigrationDataSource.destroy();
  } catch (error) {
    console.error('Error executing migrations:', error);
    process.exit(1);
  }
}

void run();
