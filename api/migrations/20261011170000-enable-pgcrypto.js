// Migración de andamiaje: habilita pgcrypto (gen_random_uuid) para las
// claves de las tablas de dominio de las specs siguientes. Sin tablas de
// dominio en spec 001.
/** @param {import('sequelize').QueryInterface} queryInterface */
export async function up(queryInterface) {
  await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
}

/** @param {import('sequelize').QueryInterface} queryInterface */
export async function down(queryInterface) {
  await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS pgcrypto;');
}
