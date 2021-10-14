
const Sequelize = require('sequelize')
const { db } = require('./db')

const Membership = db.define('memberships', {
    guildId: {
        type: Sequelize.STRING,  
        defaultValue: '414551319031054346',          
        allowNull: false
    },
    guildName: {
        type: Sequelize.STRING,  
        defaultValue: 'Format Library',          
        allowNull: false
    }
})

module.exports = Membership


