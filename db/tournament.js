
const Sequelize = require('sequelize');
const db = require('./db');

const Tournament = db.define('tournament', {
    pilot: {
        type: Sequelize.STRING,   
        allowNull: false
    },
    url: {
        type: Sequelize.STRING,      
        allowNull: false
    },
    name: {
        type: Sequelize.STRING,   
        defaultValue: 'other',    
        allowNull: false
    },
    type: {
        type: Sequelize.STRING,   
        defaultValue: 'other',   
        allowNull: false
    },
    category: {
        type: Sequelize.STRING,      
        defaultValue: 'other',
        allowNull: false
    },
    losses: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    participantId: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    playerId: {
        type: Sequelize.STRING, 
        unique: true
    }
})

module.exports = Tournament