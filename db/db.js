

const Sequelize = require('sequelize')
const { pgPassword, pgUsername } = require('../secrets')

const db = new Sequelize(
  'formatlibrary',
  pgUsername,
  pgPassword,
  { 
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false
  }
)

module.exports = {
  db
}