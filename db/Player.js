
const Sequelize = require('sequelize')
const { db } = require('./db')

const Player = db.define('players', {
    id: {
        primaryKey: true,
        type: Sequelize.STRING
    },
    name: {
        type: Sequelize.STRING
    },
    tag: {
        type: Sequelize.STRING
    },
    duelingBook: {
        type: Sequelize.STRING
    },
    realName: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    },
    admin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true
    },
    blacklisted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    avatar: {
        type: Sequelize.STRING
    }
})

module.exports = Player
