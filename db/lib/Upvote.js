
const { Sequelize } = require('sequelize')
const { db } = require('./db')

export const Upvote = db.define('upvotes', {
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
