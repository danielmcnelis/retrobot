
//UTILITY FUNCTIONS

//DATABASE IMPORTS
const { Membership, Player, Role, Stats } = require('../db/index.js')

//STATIC IMPORTS
const { mad, sad, rock, bronze, silver, gold, platinum, diamond, master, legend, god } = require('../static/emojis.json')
const formats = require('../static/formats.json')
const { adminRole, modRole, tourRole } = require('../static/roles.json')

//ASSIGN ROLES
const assignRoles = async (guild, member) => {
    const membership = await Membership.findOne({ where: { playerId: member.user.id, guildId: guild.id }})
    if (!membership) return
    const roles = await Role.findAll({ where: { membershipId: membership.id } })
    roles.forEach((r) => { member.roles.add(r.roleId) })
}

//CAPITALIZE
const capitalize = (str, eachWord = false) => {
    if (eachWord) {
        const splt = str.split(' ').map((s) => capitalize(s))
        return splt.join('')
    } else {
        return str.charAt(0).toUpperCase() + str.slice(1)
    }
} 

//CONVERT ARRAY TO OBJECT
const convertArrayToObject = (arr) => {
    const obj = {}
    arr.forEach(e => obj[e] ? obj[e]++ : obj[e] = 1)
    return obj
}

//CREATE PLAYER
const createPlayer = async (member) => {
    if (!member.user.bot) {
        try {
            await Player.create({
                id: `${member.user.id}`,
                name: `${member.user.username}`,
                tag: `${member.user.tag}`
            })
        } catch (err) {
            console.log(err)
        }
    }
}

//CREATE MEMBERSHIP
const createMembership = async (guild, member) => {
    try {
        await Membership.create({
            guildId: guild.id,
            guildName: guild.name,
            playerId: `${member.user.id}`
        })
    } catch (err) {
        console.log(err)
    }
}

//GENERATE RANDOM STRING
const generateRandomString = (length, chars) => {
    let result = '';
    for (let i = length; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
}

//GET DECK CATEGORY
const getDeckCategory = (deckType) => {
    return (deckType === 'aggro bomb' ||
        deckType === 'bazoo return' ||
        deckType === 'blackwing' ||
        deckType === 'canceller stun' ||
        deckType === 'chaos recruiter' ||
        deckType === 'chaos return' ||
        deckType === 'chaos warrior' ||
        deckType === 'dark scorpion' ||
        deckType === 'drain beatdown' ||
        deckType === 'earth beatdown' ||
        deckType === 'emissary beatdown' ||
        deckType === 'gladiator beast' ||
        deckType === 'gearfried' ||
        deckType === 'gravekeeper' ||
        deckType === 'hero beatdown' ||
        deckType === 'light beatdown' ||
        deckType === 'quickdraw plant' ||
        deckType === 'machina' ||
        deckType === 'machine' ||
        deckType === 'six samurai' ||
        deckType === 'strike ninja' ||
        deckType === 'tiger stun' ||
        deckType === 'vanilla beatdown' ||
        deckType === 'warrior' ||
        deckType === 'zombie') ? 'aggro'
        : (deckType === 'drain burn' ||
        deckType === 'final countdown' ||
        deckType === 'goat burn' ||
        deckType === 'pacman' ||
        deckType === 'stall burn' ||
        deckType === 'stall deckout') ? 'lockdown'
        : (deckType === 'ben kei otk' ||
        deckType === 'cat otk' ||
        deckType === 'dimension fusion turbo' ||
        deckType === 'dragon turbo' ||
        deckType === 'economics ftk' ||
        deckType === 'empty jar' ||
        deckType === 'exodia' ||
        deckType === 'fairy turbo' ||
        deckType === 'fish otk' ||
        deckType === 'fusion gate turbo' ||
        deckType === 'horus turbo' ||
        deckType === 'last turn' ||
        deckType === 'library ftk' ||
        deckType === 'reasoning gate turbo' ||
        deckType === 'speed burn' ||
        deckType === 'stein cat otk' ||
        deckType === 'stein gate turbo' ||
        deckType === 'stein otk' ||
        deckType === 'x-saber') ? 'combo'
        : (deckType === 'cat control' || 
        deckType === 'chaos control' ||
        deckType === 'chaos turbo' ||
        deckType === 'diva frog' ||
        deckType === 'diva hero' ||
        deckType === 'emissary control' ||
        deckType === 'fairy control' ||
        deckType === 'flip control' ||
        deckType === 'frog monarch' ||
        deckType === 'goat control' ||
        deckType === 'heavy slump' ||
        deckType === 'horus control' ||
        deckType === 'monarch' ||
        deckType === 'quickdraw plant' ||
        deckType === 'quickdraw zombie' ||
        deckType === 'relinquished' ||
        deckType === 'soul control' ||
        deckType === 'vayu turbo' ||
        deckType === 'volcanic quickdraw' ||
        deckType === 'zorc') ? 'control'
        : 'other'
}

//GET MEDAL
const getMedal = (stats, title = false) => {
    if (title) {
        return !stats ? `Gold ${gold}`
        : stats <= 230 ? `Tilted ${mad}`
        : (stats > 230 && stats <= 290) ?  `Chump ${sad}`
        : (stats > 290 && stats <= 350) ?  `Rock ${rock}`
        : (stats > 350 && stats <= 410) ?  `Bronze ${bronze}`
        : (stats > 410 && stats <= 470) ?  `Silver ${silver}`
        : (stats > 470 && stats <= 530) ?  `Gold ${gold}`
        : (stats > 530 && stats <= 590) ?  `Platinum ${platinum}`
        : (stats > 590 && stats <= 650) ?  `Diamond ${diamond}`
        : (stats > 650 && stats <= 710) ?  `Master ${master}`
        : (stats > 710 && stats <= 770) ?  `Legend ${legend}`
        : `Deity ${god}`
    } else {
        return !stats ? gold
        : stats <= 230 ? mad
        : (stats > 230 && stats <= 290) ? sad
        : (stats > 290 && stats <= 350) ? rock
        : (stats > 350 && stats <= 410) ? bronze
        : (stats > 410 && stats <= 470) ? silver
        : (stats > 470 && stats <= 530) ? gold
        : (stats > 530 && stats <= 590) ? platinum
        : (stats > 590 && stats <= 650) ? diamond
        : (stats > 650 && stats <= 710) ? master
        : (stats > 710 && stats <= 770) ? legend
        : god
    }
}

//GET FORMAT
const getFormat = (mcid) => {
    let format
    const keys = Object.keys(formats)
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        if (formats[key].channel === mcid) {
            format = key
            break
        }
    }

    return format
}

//GET RANDOM ELEMENT
const getRandomElement = (arr) => {
    const index = Math.floor((arr.length) * Math.random())
    return arr[index]
}

//GET RANDOM SUBSET
const getRandomSubset = (arr, n) => {
    const shuffledArr = arr.slice(0)
    let i = arr.length
    let temp
    let index

    while (i--) {
        index = Math.floor((i + 1) * Math.random())
        temp = shuffledArr[index]
        shuffledArr[index] = shuffledArr[i]
        shuffledArr[i] = temp
    }

    return shuffledArr.slice(0, n)
}

//IS ADMIN?
const isAdmin = (member) => member.roles.cache.some(role => role.id === adminRole)

//IS MOD?
const isMod = (member) => member.roles.cache.some(role => role.id === modRole)

//IS NEW MEMBER?
const isNewMember = async (guildId, playerId) => !await Membership.count({ where: { guildId, playerId } })

//IS NEW USER?
const isNewUser = async (id) => !await Player.count({ where: { id } })

//IS PROGRAMMER?
const isProgrammer = (member) => member.user.id === '194147938786738176'

//IS TOURNAMENT PLAYER?
const isTourPlayer = (member) => member.roles.cache.some(role => role.id === tourRole)

//SHUFFLE ARRAY
const shuffleArray = (arr) => {
    let i = arr.length
    let temp
    let index

    while (i--) {
        index = Math.floor((i + 1) * Math.random())
        temp = arr[index]
        arr[index] = arr[i]
        arr[i] = temp
    }

    return arr
}

//TRACK STATS
const trackStats = async (id, format) => {
    if (await isNewUser(id)) {
        const member = { user: { id } }
        await createPlayer(member)
        return trackStats(id, format)
    } else {
        await Stats.create({
            playerId: id,
            format
        })
    }
}

module.exports = {
    assignRoles,
    capitalize,
    convertArrayToObject,
    createMembership,
    createPlayer,
    generateRandomString,
    getDeckCategory,
    getFormat,
    getMedal,
    getRandomElement,
    getRandomSubset,
    isAdmin,
    isMod,
    isNewMember,
    isNewUser,
    isProgrammer,
    isTourPlayer,
    shuffleArray,
    trackStats
}
