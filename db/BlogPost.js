
const { Sequelize } = require('sequelize')
const { db } = require('./db')

export const BlogPost = db.define('blogposts', {
  title: {
    type: Sequelize.STRING
  },
  content: {
    type: Sequelize.TEXT
  },
  format: {
    type: Sequelize.STRING
  },
  publishDate: {
    type: Sequelize.STRING
  },
  eventDate: {
    type: Sequelize.DATE
  }
})
