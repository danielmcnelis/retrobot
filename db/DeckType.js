const Sequelize = require('sequelize')
const { db } = require('./db')

const DeckType = db.define('deckTypes', {
  name: {
    type: Sequelize.STRING
  },
  category: {
      type: Sequelize.STRING
  },
  format: {
    type: Sequelize.STRING
  },
  leftCard: {
      type: Sequelize.STRING
  },
  centerCard: {
      type: Sequelize.STRING
  },
  rightCard: {
      type: Sequelize.STRING
  }
})

module.exports = DeckType
