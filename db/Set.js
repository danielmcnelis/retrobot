
const Sequelize = require('sequelize')
const { db } = require('./db')

const Set = db.define('sets', {
  setName: {
    type: Sequelize.STRING
  },
  setCode: {
    type: Sequelize.STRING
  },
  tcgDate: {
    type: Sequelize.STRING
  },
  size: {
    type: Sequelize.INTEGER
  },
  originals: {
    type: Sequelize.INTEGER
  },
  booster: {
    type: Sequelize.BOOLEAN
  },
  tcgPlayerGroupId: {
    type: Sequelize.INTEGER
  }
})

module.exports = Set
