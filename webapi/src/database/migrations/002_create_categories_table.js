/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('categories', table => {
    table.increments('category_id').primary();
    table.integer('user_id').unsigned().references('user_id').inTable('users').onDelete('CASCADE');
    table.string('category_name', 100).notNullable();
    table.string('category_type', 50).notNullable(); // 'Income' or 'Expense'
    table.timestamp('deleted_at').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('categories');
};