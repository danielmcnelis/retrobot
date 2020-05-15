
//FUNCTIONS FOR GOATBOT

const { modRole } = require('../static/roles.json')
const { Player, Deck }  = require('../db/index.js')
const categories = require('../static/categories.json')

//CREATE PLAYER
const createPlayer = async (member) => {
    try {
        await Player.create({
            id: `${member.user.id}`,
            name: `${member.user.username}`,
            tag: `${member.user.tag}`,
            stats: 500,
            wins: 0,
            losses: 0,
            backup: null
        })
    } catch (err) {
        console.log(err)
    }
}


//IS NEW USER?
const isNewUser = async (playerId) => {
    const count = await Player.count({ where: { id: playerId } })
    return !count
}


//IS MOD?
const isMod = (member) => {
    return member.roles.cache.some(role => role.id === modRole)
}


//HAS DECK?
const hasDeck = async (member, type) => {
    const count = await Deck.count({ where: { playerId: member.user.id, type } })
    return count
}

//GET CAT
const getCat = (type) => {
    console.log('type is: ', type)
    let category
    const keys = Object.keys(categories)
    keys.forEach(function (cat) {
        if (categories[cat].includes(type)) {
            category = cat
        }
    })

    console.log('getting cat >>> ', category)
    return category
}

//CAPITALIZE
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

module.exports = {
    capitalize,
    createPlayer,
    isNewUser,
    isMod,
    hasDeck,
    getCat
}
