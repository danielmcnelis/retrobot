
const Sequelize = require('sequelize')
const { db } = require('./db')

const Video = db.define('videos', {     
  title: {
    type: Sequelize.STRING
  },
  author: {
    type: Sequelize.STRING
  },
  playerId: {
    type: Sequelize.STRING
  },
  url: {
    type: Sequelize.STRING
  },
  format: {
    type: Sequelize.STRING
  },
  publishDate: {
    type: Sequelize.STRING
  }
})

module.exports = Video