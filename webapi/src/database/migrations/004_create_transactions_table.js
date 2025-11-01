/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('transactions', table => {
    table.increments('transaction_id').primary();
    table.integer('user_id').unsigned().references('user_id').inTable('users').onDelete('CASCADE');
    table.integer('account_id').unsigned().references('account_id').inTable('accounts').onDelete('CASCADE');
    table.integer('category_id').unsigned().references('category_id').inTable('categories').onDelete('SET NULL');
    table.string('transaction_type', 50).notNullable(); // 'INCOME', 'EXPENSE', 'TRANSFER'
    table.decimal('amount', 15, 2).notNullable();
    table.text('description');
    table.date('transaction_date').notNullable().defaultTo(knex.fn.now());
    table.uuid('transfer_group_id').nullable(); // For linking transfer transactions
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    
    table.index(['user_id', 'transaction_date']);
    table.index(['account_id']);
    table.index(['category_id']);
    table.index(['transfer_group_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('transactions');
};