
const Sequelize = require('sequelize')
const db = require('./db')

const Upvote = db.define('upvotes', {
  playerId: {
    type: Sequelize.STRING
  },
  contentType: {
    type: Sequelize.STRING
  },
  articleId: {
    type: Sequelize.INTEGER
  },
  cubeId: {
    type: Sequelize.INTEGER
  },
  deckId: {
    type: Sequelize.INTEGER
  },
  videoId: {
    type: Sequelize.INTEGER
  }
})

module.exports = Upvote