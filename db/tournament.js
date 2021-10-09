
const Sequelize = require('sequelize')
const {db} = require('./db')

const Tournament = db.define('tournament', {
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
        allowNull: false,
        unique: true
    },
    type: {
        type: Sequelize.STRING,   
        defaultValue: 'double elimination',   
        allowNull: false
    },
    state: {
        type: Sequelize.STRING,   
        defaultValue: 'pending',   
        allowNull: false
    },
    rounds: {
        type: Sequelize.INTEGER,   
        defaultValue: null,   
        allowNull: true 
    }
})

module.exports = Tournament