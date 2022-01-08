
const Sequelize = require('sequelize')
const { pgPassword } = require('../secrets.json')
console.log('pgPassword', pgPassword)

const db = new Sequelize(
  'formatlibrary',
  'ubuntu',
  pgPassword,
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