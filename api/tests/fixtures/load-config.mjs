// Fixture de tests: importa la config del CLI como lo haría sequelize-cli y
// reporta las entradas cargadas. La guardia interna de config.js corre con
// process.argv de este proceso (los flags se pasan tras el path del fixture).
const config = (await import(process.env.CONFIG_UNDER_TEST)).default;
console.log('LOADED ' + Object.keys(config).join(','));
console.log(
  `TEST_ENTRY=${JSON.stringify({
    database: config.test?.database,
    host: config.test?.host,
    port: config.test?.port,
    username: config.test?.username,
    dialect: config.test?.dialect,
    logging: config.test?.logging,
  })}`,
);
