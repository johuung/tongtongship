module.exports = {
  development: {
    username: process.env.TONGTONGSHIP_DB_USERNAME,
    password: process.env.TONGTONGSHIP_DB_PASSWORD,
    database: process.env.TONGTONGSHIP_DB_DATABASE,
    host: process.env.TONGTONGSHIP_DB_HOST,
    dialect: process.env.TONGTONGSHIP_DB_ENGINE
  }
};
