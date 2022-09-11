
const Sequelize = require('sequelize')
const { db } = require('./db')

const Entry = db.define('entries', {
    playerName: {
        type: Sequelize.STRING
    },
    active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
    deckId: {
        type: Sequelize.INTEGER
    },
    tournamentId: {
        type: Sequelize.STRING
    }
})

module.exports = Entry