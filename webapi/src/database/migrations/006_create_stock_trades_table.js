/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('stock_trades', table => {
    table.increments('trade_id').primary();
    table.integer('user_id').unsigned().references('user_id').inTable('users').onDelete('CASCADE');
    table.integer('account_id').unsigned().references('account_id').inTable('accounts').onDelete('CASCADE');
    table.integer('security_id').unsigned().references('security_id').inTable('securities').onDelete('CASCADE');
    table.string('trade_type', 4).notNullable(); // 'BUY' or 'SELL'
    table.decimal('quantity', 15, 5).notNullable();
    table.decimal('price_per_share', 15, 2).notNullable();
    table.date('trade_date').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    
    table.index(['user_id', 'trade_date']);
    table.index(['account_id']);
    table.index(['security_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('stock_trades');
};