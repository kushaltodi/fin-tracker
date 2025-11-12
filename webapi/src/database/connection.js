const knex = require('knex');
const config = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const usePostgreSQL = process.env.USE_POSTGRES === 'true';

console.log('\n🗄️  Database Configuration:');
console.log(`   Environment: ${environment}`);
console.log(`   Database Type: ${usePostgreSQL ? 'PostgreSQL' : 'SQLite'}`);

if (usePostgreSQL) {
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   Port: ${process.env.DB_PORT || 5432}`);
  console.log(`   Database: ${process.env.DB_NAME || 'finflux_db'}`);
  console.log(`   User: ${process.env.DB_USER || 'finflux_user'}`);
} else {
  console.log(`   File: ./data/fin_tracker${environment === 'production' ? '_prod' : ''}.db`);
}
console.log('');

const db = knex(config[environment]);

// Test database connection
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ Database connection established successfully');
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    if (usePostgreSQL) {
      console.error('   💡 Check your PostgreSQL connection settings');
      console.error('   💡 Make sure PostgreSQL server is running');
      console.error('   💡 Verify environment variables: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME');
    } else {
      console.error('   💡 Check if SQLite database file exists and is accessible');
      console.error('   💡 Verify data directory permissions');
    }
  });

module.exports = db;