
const Sequelize = require('sequelize')
const { db } = require('./db')

const Stats = db.define('stats', {
    format: {
        type: Sequelize.STRING,         
        allowNull: false
    },
    elo: {
        type: Sequelize.FLOAT,  
        defaultValue: 500.00,          
        allowNull: false
    },
    backupElo: {
        type: Sequelize.FLOAT,  
        defaultValue: null,          
        allowNull: true
    },
    wins: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,          
        allowNull: false
    },
    losses: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,          
        allowNull: false
    },
    internal: {
        type: Sequelize.BOOLEAN,        
        allowNull: true
    }
})

module.exports = Stats


