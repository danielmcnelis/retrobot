
const Sequelize = require('sequelize')
const { db } = require('./db')

const Queue = db.define('queue', {
    url: {
        type: Sequelize.STRING,  
        allowNull: false
    },
    format: {
        type: Sequelize.STRING,  
        defaultValue: 'goat',
        allowNull: false
    },
    position: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,          
        allowNull: false
    }
})

module.exports = Queue

