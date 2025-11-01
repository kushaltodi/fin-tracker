/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('securities', table => {
    table.increments('security_id').primary();
    table.string('ticker_symbol', 20).unique().notNullable();
    table.string('security_name', 255);
    table.string('asset_type', 50); // 'Stock', 'ETF', 'Mutual Fund', etc.
    table.timestamp('deleted_at').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('securities');
};