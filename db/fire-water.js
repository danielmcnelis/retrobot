
const Sequelize = require('sequelize');
const db = require('./db');

const FireWater = db.define('fireWaterStats', {
    stats: {
        type: Sequelize.FLOAT,   
        defaultValue: 500.00,             
        allowNull: false
    },
    backup: {
        type: Sequelize.FLOAT,
        defaultValue: 0.00,        
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
    }
})

module.exports = FireWater