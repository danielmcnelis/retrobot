
const Sequelize = require('sequelize')
const { db } = require('./db')

const Entry = db.define('entry', {
    pilot: {
        type: Sequelize.STRING,   
        allowNull: false
    },
    url: {
        type: Sequelize.STRING,      
        allowNull: false
    },
    deck_name: {
        type: Sequelize.TEXT,   
        defaultValue: 'other',    
        allowNull: false
    },
    deck_type: {
        type: Sequelize.STRING,   
        defaultValue: 'other',   
        allowNull: false
    },
    deck_category: {
        type: Sequelize.STRING,      
        defaultValue: 'other',
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
        type: Sequelize.STRING
    },
    tournamentId: {
        type: Sequelize.STRING
    }
})

module.exports = Entry