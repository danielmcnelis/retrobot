
const Sequelize = require('sequelize')
const { db } = require('./db')

const Entry = db.define('entries', {
    pilot: {
        type: Sequelize.STRING,   
        allowNull: false
    },
    url: {
        type: Sequelize.STRING,      
        allowNull: false
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
        type: Sequelize.INTEGER,
        allowNull: false
    },
    playerId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    tournamentId: {
        type: Sequelize.STRING,
        allowNull: false
    }
})

module.exports = Entry