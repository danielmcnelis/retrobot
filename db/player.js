
const Sequelize = require('sequelize')
const { db } = require('./db')

const Player = db.define('players', {
    id: {
        primaryKey: true,
        type: Sequelize.INTEGER
    },
    name: {
        type: Sequelize.STRING
    },
    discriminator: {
        type: Sequelize.STRING
    },
    discordId: {
        type: Sequelize.STRING
    },
    duelingBook: {
        type: Sequelize.STRING
    },
    firstName: {
        type: Sequelize.STRING
    },
    lastName: {
        type: Sequelize.STRING
    },
    hash: {
        type: Sequelize.STRING
    },
    admin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    hidden: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    avatar: {
        type: Sequelize.STRING
    }
})

module.exports = Player
