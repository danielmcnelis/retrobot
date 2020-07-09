
const Sequelize = require('sequelize');
const db = require('./db');

const Frog = db.define('frogStats', {
    stats: {
        type: Sequelize.FLOAT,        
        allowNull: false
    },
    backup: {
        type: Sequelize.FLOAT,        
        allowNull: true
    },
    wins: {
        type: Sequelize.INTEGER,        
        allowNull: false
    },
    losses: {
        type: Sequelize.INTEGER,        
        allowNull: false
    }
})

module.exports = Frog