
const Sequelize = require('sequelize')

const db = new Sequelize(
  'localhost:5432/formatlibrary',
  'postgres',
  null,
  { logging: false })

module.exports = {
  db
}