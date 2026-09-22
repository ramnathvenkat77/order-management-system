import 'reflect-metadata';
import 'dotenv/config';

import { getPostgresConnection } from './data-source';

const MigrationDataSource = getPostgresConnection();

export default MigrationDataSource;