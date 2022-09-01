
const Sequelize = require('sequelize')
const { db } = require('./db')

const Player = db.define('players', {
    name: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING
    },
    googleName: {
        type: Sequelize.STRING
    },
    googlePfp: {
        type: Sequelize.STRING
    },
    discordName: {
        type: Sequelize.STRING
    },
    discriminator: {
        type: Sequelize.STRING
    },
    discordId: {
        type: Sequelize.STRING
    },
    discordAvatar: {
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
    }
})

module.exports = Player
