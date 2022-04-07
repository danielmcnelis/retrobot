
const Sequelize = require('sequelize')
const { db } = require('./db')

const Tournament = db.define('tournaments', {
    id: {
        primaryKey: true,
        type: Sequelize.STRING,   
        allowNull: false,
        unique: true
    },
    name: {
        type: Sequelize.STRING,  
        defaultValue: 'New Tournament',  
        allowNull: false
    },
    format: {
        type: Sequelize.STRING,  
        defaultValue: 'goat',  
        allowNull: false
    },
    url: {
        type: Sequelize.STRING,      
        allowNull: true
    },
    display: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false,   
        allowNull: false
    },
    cleanName: {
        type: Sequelize.STRING,   
        allowNull: true
    },
    shortName: {
        type: Sequelize.STRING,   
        allowNull: true
    },
    winner: {
        type: Sequelize.STRING,   
        allowNull: true
    },
    playerId: {
        type: Sequelize.STRING,   
        allowNull: true
    },
    size: {
        type: Sequelize.INTEGER,   
        defaultValue: 0,   
        allowNull: false
    },
    type: {
        type: Sequelize.STRING, 
        defaultValue: 'double elimination',   
        allowNull: false
    },
    series: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false,   
        allowNull: false
    },
    worlds: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false,   
        allowNull: false
    },
    state: {
        type: Sequelize.STRING,   
        defaultValue: 'pending',   
        allowNull: false
    },
    rounds: {
        type: Sequelize.INTEGER,   
        allowNull: true 
    },
    community: {
        type: Sequelize.STRING,   
        defaultValue: 'Format Library',   
        allowNull: true
    },
    channelId: {
        type: Sequelize.STRING,   
        allowNull: true
    },
    guildId: {
        type: Sequelize.STRING,      
        allowNull: true
    },
    startDate: {
        type: Sequelize.DATE,      
        allowNull: true
    },
    endDate: {
        type: Sequelize.DATE,      
        allowNull: true
    },
})

module.exports = Tournament