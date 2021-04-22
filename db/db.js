
const Sequelize = require('sequelize')
const db = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost:5432/retrobot', {
  logging: false
})

const db2 = new Sequelize('postgres://localhost:5432/formatlibrary', {
  logging: false
})

module.exports = {
  db,
  db2
}
