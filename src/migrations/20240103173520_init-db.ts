import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('hostnames', (table) => {
        table.specificType('id', 'CHAR(16)').primary(); 
        table.string('fqdn', 255).notNullable().unique(); 
        table.text('redirect_to').notNullable();
        table.boolean('force_https').notNullable().defaultTo(false);
        table.timestamp('under_maintenance_since');
        table.uuid('uuid').notNullable().unique();
        table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now()); 
        table.timestamp('updatedAt').notNullable();
        table.timestamp('deletedAt');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('hostnames');
}