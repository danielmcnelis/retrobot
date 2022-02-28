
const Sequelize = require('sequelize')
const { db } = require('./db')

const Iron = db.define('iron', {
    name: {
        type: Sequelize.STRING,   
        allowNull: false
    },
    format: {
        type: Sequelize.STRING,      
        defaultValue: 'goat',
        allowNull: false
    },
    team: {
        type: Sequelize.STRING,       
        defaultValue: null, 
        allowNull: true
    },
    paired: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false,    
        allowNull: false
    },
    eliminated: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false,    
        allowNull: false
    },
    position: {
        type: Sequelize.INTEGER,   
        allowNull: true
    },
    captain: {
        type: Sequelize.BOOLEAN,   
        allowNull: true
    },
    confirmed: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false,    
        allowNull: false
    }
})

module.exports = Iron