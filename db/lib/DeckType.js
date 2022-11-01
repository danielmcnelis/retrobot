
const { Sequelize } = require('sequelize')
const { db } = require('./db')

export const DeckType = db.define('deckTypes', {
  name: {
    type: Sequelize.STRING
  },
  category: {
    type: Sequelize.STRING
  }
})
