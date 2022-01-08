
const Sequelize = require('sequelize')

const db = new Sequelize(
  'formatlibrary',
  'postgres',
  null,
  { 
    host: 'localhost',
    post: 5432,
    dialect: 'postgres',
    logging: false
  }
)

module.exports = {
  db
}