
const Sequelize = require('sequelize')
const db = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost:5432/retrobot', {
  logging: false
})

console.log('test1', !!db)

const db2 = new Sequelize('postgres://localhost:5432/formatlibrary', {
  logging: false
})

console.log('test2', !!db2)

module.exports = {
  db,
  db2
}
