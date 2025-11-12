const path = require('path');
require('dotenv').config();

// Database type toggle based on environment variable
const usePostgreSQL = process.env.USE_POSTGRES === 'true';

// Common configuration
const commonConfig = {
  migrations: {
    directory: path.join(__dirname, 'src', 'database', 'migrations')
  },
  seeds: {
    directory: path.join(__dirname, 'src', 'database', 'seeds')
  }
};

// SQLite configuration
const sqliteConfig = {
  client: 'sqlite3',
  useNullAsDefault: true,
  connection: {
    filename: path.join(__dirname, 'data', 'fin_tracker.db')
  }
};

// PostgreSQL configuration
const postgresConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'finflux_user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'finflux_db',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  },
  pool: {
    min: 2,
    max: 10
  }
};

module.exports = {
  development: {
    ...(usePostgreSQL ? postgresConfig : sqliteConfig),
    ...commonConfig
  },

  test: {
    client: 'sqlite3',
    connection: ':memory:',
    useNullAsDefault: true,
    ...commonConfig
  },

  production: {
    ...(usePostgreSQL ? {
      ...postgresConfig,
      connection: {
        ...postgresConfig.connection,
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      }
    } : {
      ...sqliteConfig,
      connection: {
        filename: path.join(__dirname, 'data', 'fin_tracker_prod.db')
      },
      pool: {
        min: 2,
        max: 10
      }
    }),
    ...commonConfig
  }
};