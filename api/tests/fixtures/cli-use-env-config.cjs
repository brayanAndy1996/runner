// Fixture de tests (ADV-001 residual F2/F4): entrada "test" con una database
// *_test válida pero use_env_variable apuntando a una URL sin path de BD.
// sequelize-cli fusiona parseDbUrl(namedURL) SOBRE la config (lodash.merge):
// una URL raíz '/' produce database:'' y pisa la *_test, desviando a PGDATABASE.
module.exports = {
  test: {
    database: 'runner_test',
    use_env_variable: 'RUNNER_SLASH_URL',
    dialect: 'postgres',
  },
};
