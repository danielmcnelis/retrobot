
const Sequelize = require('sequelize')
const { db } = require('./db')

const Format = db.define('formats', {
  name: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  date: {
    type: Sequelize.STRING,
    allowNull: true
  },
  banlist: {
    type: Sequelize.STRING,
    allowNull: true
  },
  event: {
    type: Sequelize.STRING,
    allowNull: true
  },
  icon: {
    type: Sequelize.STRING,
    allowNull: true
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  channel: {
    type: Sequelize.STRING,
    allowNull: true
  },
  emoji: {
    type: Sequelize.STRING,
    allowNull: true
  },
  role: {
    type: Sequelize.STRING,
    allowNull: true
  },
  popular: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: true
  }
})

module.exports = Format
