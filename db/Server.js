
const Sequelize = require('sequelize')
const { db } = require('./db')

const Server = db.define('servers', {
    id: {
        primaryKey: true,
        type: Sequelize.STRING
    },
    name: {
        type: Sequelize.STRING
    },
    format: {
        type: Sequelize.STRING
    },
    internalLadder: {
        type: Sequelize.BOOLEAN
    },
    access: {
        type: Sequelize.STRING,   
        defaultValue: 'free'
    },
    emoji: {
        type: Sequelize.STRING
    },
    formatEmoji: {
        type: Sequelize.STRING
    }
})

module.exports = Server


