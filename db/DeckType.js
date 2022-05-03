const Sequelize = require('sequelize')
const { db } = require('./db')

const DeckType = db.define('deckTypes', {
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  category: {
      type: Sequelize.STRING,
      defaultValue: 'other',
      allowNull: false
  },
  format: {
    type: Sequelize.STRING,
    allowNull: true
  },
  leftCard: {
      type: Sequelize.STRING,
      allowNull: true
  },
  centerCard: {
      type: Sequelize.STRING,
      allowNull: true
  },
  rightCard: {
      type: Sequelize.STRING,
      allowNull: true
  }
})

module.exports = DeckType
