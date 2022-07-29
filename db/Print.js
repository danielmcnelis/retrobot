
const Sequelize = require('sequelize')
const { db } = require('./db')

const Print = db.define('prints', {
  cardName: {
    type: Sequelize.STRING
  },
  cardCode: {
    type: Sequelize.STRING
  },
  setName: {
    type: Sequelize.STRING
  },
  rarity: {
    type: Sequelize.STRING
  },
  original: {
    type: Sequelize.BOOLEAN
  },
  marketPrice: {
    type: Sequelize.FLOAT,
    defaultValue: 0.00
  },
  tcgPlayerProductId: {
    type: Sequelize.INTEGER
  },
  tcgPlayerUrl: {
    type: Sequelize.TEXT
  }
})

module.exports = Print
