
const Sequelize = require('sequelize')
const { db } = require('./db')

const RatedPool = db.define('ratedPools', {
    name: {
        type: Sequelize.STRING,   
        allowNull: false
    },
    format: {
        type: Sequelize.STRING,      
        defaultValue: 'Goat',
        allowNull: false
    }
})

module.exports = RatedPool