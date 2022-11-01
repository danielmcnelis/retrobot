
const Sequelize = require('sequelize')
const { db } = require('./db')

const Article = db.define('articles', {     
  title: {
    type: Sequelize.STRING
  },
  author: {
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
  rating: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  views: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  }
})

module.exports = Article