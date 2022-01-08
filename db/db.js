
const Sequelize = require('sequelize')
const { pgPassword } = require('../secrets.json')

const db = new Sequelize(
  'formatlibrary',
  'ubuntu',
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