
const Sequelize = require('sequelize')
const { db } = require('./db')

const Membership = db.define('memberships', {
    guildName: {
        type: Sequelize.STRING,  
        defaultValue: 'Format Library',          
        allowNull: false
    },
    active: {
        type: Sequelize.BOOLEAN,  
        defaultValue: true,          
        allowNull: false
    }
})

module.exports = Membership


