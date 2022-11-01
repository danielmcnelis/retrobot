
const { Sequelize } = require('sequelize')
const { db } = require('./db')

const DeckThumb = db.define('deckThumbs', {
  name: {
    type: Sequelize.STRING
  },
  format: {
    type: Sequelize.STRING
  },
  formatId: {
    type: Sequelize.INTEGER
  },
  primary: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  leftCard: {
    type: Sequelize.STRING
  },
  leftCardYpdId: {
    type: Sequelize.STRING
  },
  centerCard: {
    type: Sequelize.STRING
  },
  centerCardYpdId: {
    type: Sequelize.STRING
  },
  rightCard: {
    type: Sequelize.STRING
  },
  rightCardYpdId: {
    type: Sequelize.STRING
  }
})

module.exports = DeckThumb