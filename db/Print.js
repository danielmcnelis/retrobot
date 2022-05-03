
const Sequelize = require('sequelize')
const { db } = require('./db')

const Print = db.define('prints', {
  cardName: {
    type: Sequelize.STRING,
    allowNull: false
  },
  cardCode: {
    type: Sequelize.STRING,
    allowNull: false
  },
  setName: {
    type: Sequelize.STRING,
    allowNull: false
  },
  rarity: {
    type: Sequelize.STRING,
    allowNull: true
  },
  marketPrice: {
    type: Sequelize.FLOAT,
    defaultValue: 0.00,
    allowNull: true
  },
  tcgPlayerProductId: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  tcgPlayerUrl: {
    type: Sequelize.TEXT,
    allowNull: true
  }
})

module.exports = Print
