
const Sequelize = require('sequelize');
const db = require('./db');

const GrassZoo = db.define('grassZooStats', {
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

module.exports = GrassZoo