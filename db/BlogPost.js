
const Sequelize = require('sequelize')
const { db } = require('./db')

const BlogPost = db.define('blogposts', {
  title: {
    type: Sequelize.STRING,
    defaultValue: '',
    allowNull: false
  },
  content: {
      type: Sequelize.TEXT,
      defaultValue: '',
      allowNull: false
  },
  author: {
    type: Sequelize.STRING,
    allowNull: true
  },
  format: {
    type: Sequelize.STRING,
    allowNull: true
  },
  rating: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  views: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  publishDate: {
    type: Sequelize.STRING,
    allowNull: true
  },
  playerId: {
      type: Sequelize.STRING,
      allowNull: true
  }
})

module.exports = BlogPost