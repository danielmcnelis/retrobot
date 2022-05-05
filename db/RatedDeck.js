
const Sequelize = require('sequelize')
const { db } = require('./db')

const RatedDeck = db.define('ratedDecks', {
  builder: {
    type: Sequelize.STRING,
    allowNull: true
  },
  format: {
    type: Sequelize.STRING,
    allowNull: false
  },
  name: {
    type: Sequelize.STRING,
    defaultValue: 'Unnamed Deck',
    allowNull: true
  },
  url: {
    type: Sequelize.STRING,
    allowNull: false
  },
  deckType: {
      type: Sequelize.STRING,
      allowNull: true
  },
  ydk: {
    type: Sequelize.TEXT,
    allowNull: true
  }
})

module.exports = RatedDeck
