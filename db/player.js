
const Sequelize = require('sequelize');
const db = require('./db');

const Player = db.define('player', {
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    discordId: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    tag: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    stats: {
        type: Sequelize.NUMBER,        
        allowNull: false
    },
    backup: {
        type: Sequelize.NUMBER,        
        allowNull: false
    },
    wins: {
        type: Sequelize.NUMBER,        
        allowNull: false
    },
    losses: {
        type: Sequelize.NUMBER,        
        allowNull: false
    }
})

module.exports = Player

