
const Sequelize = require('sequelize')
const {db} = require('./db')

const Info = db.define('infos', {
    element: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.STRING
    }
})

module.exports = Info
