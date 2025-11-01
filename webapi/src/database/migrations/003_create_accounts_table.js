/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('accounts', table => {
    table.increments('account_id').primary();
    table.integer('user_id').unsigned().references('user_id').inTable('users').onDelete('CASCADE');
    table.string('account_name', 100).notNullable();
    table.string('account_type', 50).notNullable(); // 'Bank', 'Investment', 'Loan', etc.
    table.decimal('initial_balance', 15, 2).defaultTo(0.00);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('accounts');
};