
const Sequelize = require('sequelize')
const { db } = require('./db')

const Server = db.define('servers', {
    id: {
        primaryKey: true,
        type: Sequelize.STRING,
        allowNull: false
    },
    name: {
        type: Sequelize.STRING,         
        allowNull: true
    },
    format: {
        type: Sequelize.STRING,        
        allowNull: true
    },
    internalLadder: {
        type: Sequelize.BOOLEAN,        
        allowNull: true
    },
    access: {
        type: Sequelize.STRING,   
        defaultValue: 'free',       
        allowNull: true
    },
    emoji: {
        type: Sequelize.STRING,       
        allowNull: true
    },
    formatEmoji: {
        type: Sequelize.STRING,       
        allowNull: true
    }
})

module.exports = Server


