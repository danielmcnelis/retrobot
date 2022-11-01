
const { Sequelize } = require('sequelize')
const { db } = require('./db')

export const Set = db.define('sets', {
  setName: {
    type: Sequelize.STRING
  },
  setCode: {
    type: Sequelize.STRING
  },
  tcgDate: {
    type: Sequelize.STRING
  },
  booster: {
    type: Sequelize.BOOLEAN
  },
  size: {
    type: Sequelize.INTEGER
  },
  originals: {
    type: Sequelize.INTEGER
  },
  tcgPlayerGroupId: {
    type: Sequelize.INTEGER
  }
})
