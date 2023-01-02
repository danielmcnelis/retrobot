
const Sequelize = require('sequelize')
const db = require('./db')

const Entry = db.define('entries', {
    playerName: {
        type: Sequelize.STRING
    },
    url: {
        type: Sequelize.STRING
    },
    ydk: {
        type: Sequelize.TEXT
    },
    active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    roundDropped: {
        type: Sequelize.INTEGER
    },
    wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    losses: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    participantId: {
        type: Sequelize.INTEGER
    },
    playerId: {
        type: Sequelize.STRING
    },
    tournamentId: {
        type: Sequelize.STRING
    }
})

module.exports = Entry