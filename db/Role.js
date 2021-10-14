
const Sequelize = require('sequelize')
const { db } = require('./db')

const Role = db.define('roles', {
    roleId: {
        type: Sequelize.STRING,  
        defaultValue: '578392585542828052',          
        allowNull: false
    },
    roleName: {
        type: Sequelize.STRING,  
        defaultValue: 'Goat Players',          
        allowNull: false
    }
})

module.exports = Role
