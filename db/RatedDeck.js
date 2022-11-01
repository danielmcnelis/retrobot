
const Sequelize = require('sequelize')
const db = require('./db')

const RatedDeck = db.define('ratedDecks', {
  builder: {
    type: Sequelize.STRING
  },
  playerId: {
    type: Sequelize.STRING
  },
  format: {
    type: Sequelize.STRING
  },
  name: {
    type: Sequelize.STRING
  },
  url: {
    type: Sequelize.STRING
  },
  deckType: {
      type: Sequelize.STRING
  },
  ydk: {
    type: Sequelize.TEXT
  }
})

module.exports = RatedDeck