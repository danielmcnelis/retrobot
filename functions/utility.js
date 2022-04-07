
//UTILITY FUNCTIONS

//MODULE IMPORTS
const fs = require('fs')
const Discord = require('discord.js')
const { Op } = require('sequelize')
const { exec } = require('child_process')

//DATABASE IMPORTS
const { Card, Info, Membership, Player, Role, Stats, Status } = require('../db/index.js')

//STATIC IMPORTS
const { mad, sad, rock, bronze, silver, gold, platinum, diamond, master, legend, god, ATK, DEF,
    DARK, LIGHT, EARTH, WIND, WATER, DIVINE, FIRE, Aqua, Beast, BeastWarrior, Continuous, 
    Counter, Cyberse, Dinosaur, DivineBeast, Dragon, Equip, Fairy, Field, Fiend, Fish, 
    Insect, Link, Machine, Normal, Plant, Psychic, Pyro, QuickPlay, Rank, Reptile, 
    Ritual, Rock, Scale, SeaSerpent, Spell, Spellcaster, Star, Thunder, Trap, Warrior, 
    WingedBeast, Wyrm, Zombie, forbidden, limited, semi
 } = require('../static/emojis.json')
const formats = require('../static/formats.json')
const { adminRole, ambassadorRole, ironRole, modRole, tourRole } = require('../static/roles.json')

//CLEAR STATUS
const clearStatus = async (element) => {
    const info = await Info.findOne({ where: { element } })
    if (!info) throw new Error(`Could not find Info where element = ${element}`)
    info.status = 'free'
    await info.save()
}

//FETCH CARD NAMES
const fetchCardNames = async () => {
    const names = [...await Card.findAll()].map((card) => card.name)
    return names
}

//FIND CARD
const findCard = async (query, fuzzyCards) => {
    const fuzzy_search = fuzzyCards.get(query, null, 0.36) || []
	fuzzy_search.sort((a, b) => b[0] - a[0])
	if (!fuzzy_search[0]) return false

	let partial_match
	if (query.length >= 10) {
		for (let i = 0; i < fuzzy_search.length; i++) {
			const result = fuzzy_search[i][1]
			if (result.replace(/[^\ws]/gi, "").toLowerCase().includes(query.toLowerCase())) {
				partial_match = result
				break
			}
		}
	}

	const card_name = partial_match ? partial_match :
		fuzzy_search[0][0] > 0.5 ? fuzzy_search[0][1] :
		null
		
    return card_name
}

//SEARCH
const search = async (query, fuzzyCards, formatName, formatEmoji, formatDate, formatList) => {
	const card_name = await findCard(query, fuzzyCards)
	if (!card_name) return false

	const card = await Card.findOne({ 
		where: { 
			name: {
				[Op.iLike]: card_name
			}
		}
	})

	if (!card) return false

    const status = await Status.findOne({ 
        where: { 
            name: {
                [Op.iLike]: card_name
            } 
        }
    })

    const position = status ? status[formatList] : 'unlimited'
    const indicator = position === 'unlimited' ? '' :
        position === 'semi-limited' ? semi :
        position === 'limited' ? limited :
        position === 'forbidden' ? forbidden :
        ''
    const legal = card.tcgDate && (card.tcgDate <= formatDate)
	const color = card.category === "Spell" ? "#42f578" :
		card.category === "Trap" ? "#e624ed" :
		card.category === "Monster" && card.fusion ? "#a930ff" :
		card.category === "Monster" && card.ritual ? "#3b7cf5" :
		card.category === "Monster" && card.synchro ? "#ebeef5" :
		card.category === "Monster" && card.xyz ? "#6e6e6e" :
		card.category === "Monster" && card.pendulum ? "#a5e096" :
		card.category === "Monster" && card.link ? "#468ef2" :
		card.category === "Monster" && card.normal ? "#faf18e" :
		card.category === "Monster" && card.effect ? "#f5b042" :
		null

	const classes = []
	if (card.normal) classes.push("Normal")
	if (card.fusion) classes.push("Fusion")
	if (card.ritual) classes.push("Ritual")
	if (card.synchro) classes.push("Synchro")
	if (card.xyz) classes.push("Xyz")
	if (card.pendulum) classes.push("Pendulum")
	if (card.link) classes.push("Link")
	if (card.flip) classes.push("Flip")
	if (card.gemini) classes.push("Gemini")
	if (card.spirit) classes.push("Spirit")
	if (card.toon) classes.push("Toon")
	if (card.tuner) classes.push("Tuner")
	if (card.union) classes.push("Union")
	if (card.effect) classes.push("Effect")

	const labels = card.category === "Monster" ? 
		`Attribute: ${card.attribute} ${eval(card.attribute)}` + 
		`\n${card.xyz ? `Rank: ${card.level} ${Rank}` : card.link ? `Link Rating: ${card.rating} ${Link}` : `Level: ${card.level} ${Star}`}` +
		`\nRelease Date: ${card.tcgDate || 'OCG Only'}` +
        `${formatName ? `\n${formatName} ${formatEmoji} Status: ${legal ? `${capitalize(position)} ${indicator}` : 'Not Legal'}` : ''}` +
		`\n**[** ${card.type} ${eval(card.type.replace(/[^\ws]/gi, ""))} / ${classes.join(" / ")} **]**` :
		`Card: ${card.category} ${eval(card.category)}` +
        `\nCategory: ${card.icon} ${eval(card.icon.replace(/[^\ws]/gi, ""))}` +
		`\nRelease Date: ${card.tcgDate || 'OCG Only'}` +
        `${formatName ? `\n${formatName} ${formatEmoji} Status: ${legal ? `${capitalize(position)} ${indicator}` : 'Not Legal'}` : ''}`
	
	const stats = card.category === "Monster" ? 
			`ATK: ${card.atk === null ? '?' : card.atk} ${ATK}` + 
			` ${!card.link ? `DEF: ${card.def === null ? '?' : card.def} ${DEF}` : ''}` :
			''
	
	const attachment = fs.existsSync(`../formatlibrary/public/images/cards/${card.ypdId}.png`) ?
		new Discord.MessageAttachment(`../formatlibrary/public/images/cards/${card.ypdId}.png`, `${card.ypdId}.png`) :
		false

	const thumbnail = attachment ? `attachment://${card.ypdId}.png` : `https://ygoprodeck.com/pics/${card.ypdId}.png`    
    const cardEmbed = new Discord.MessageEmbed()
	cardEmbed.setColor(color)
	cardEmbed.setTitle(card.name)
	cardEmbed.setThumbnail(thumbnail)
	cardEmbed.setDescription(`${labels}\n\n${card.description}\n\n${stats}`)
	return { cardEmbed, attachment }
}

//ASSIGN ROLES
const assignRoles = async (guild, member) => {
    const membership = await Membership.findOne({ where: { playerId: member.user.id, guildId: guild.id }})
    if (!membership) return
    const roles = await Role.findAll({ where: { membershipId: membership.id } })
    roles.forEach(async (r) => { 
        try {
            await member.roles.add(r.roleId).catch((err) => console.log(err))
        } catch (err) {
            console.log(err)
        }
    })
}

//CAPITALIZE
const capitalize = (str, eachWord = false) => {
    if (eachWord) {
        const splt = str.split(' ').map((s) => capitalize(s))
        return splt.join(' ')
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
        : (deckType === 'counter fairy' ||
        deckType === 'drain burn' ||
        deckType === 'final countdown' ||
        deckType === 'goat burn' ||
        deckType === 'pacman' ||
        deckType === 'stall burn' ||
        deckType === 'stall deckout') ? 'lockdown'
        : (deckType === 'ben kei otk' ||
        deckType === 'cat otk' ||
        deckType === 'chain burn' ||
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

//IS PROGRAMMER?
const isProgrammer = (member) => member && member.user.id === '194147938786738176'

//IS ADMIN?
const isAdmin = (member) => member && member.roles.cache.some(role => role.id === adminRole)

//IS MOD?
const isMod = (member) => member && member.roles.cache.some(role => role.id === modRole || role.id === adminRole)

//IS AMBASSADOR?
const isAmbassador = (member) => member && member.roles.cache.some(role => role.id === ambassadorRole || role.id === modRole || role.id === adminRole)

//IS IRON PLAYER?
const isIronPlayer = (member) => member && member.roles.cache.some(role => role.id === ironRole)

//IS NEW MEMBER?
const isNewMember = async (guildId, playerId) => !await Membership.count({ where: { guildId, playerId } })

//IS NEW USER?
const isNewUser = async (id) => !await Player.count({ where: { id } })

//IS TOURNAMENT PLAYER?
const isTourPlayer = (member) => member && member.roles.cache.some(role => role.id === tourRole)

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
    clearStatus,
    createMembership,
    createPlayer,
    fetchCardNames,
    generateRandomString,
    getDeckCategory,
    getFormat,
    getMedal,
    getRandomElement,
    getRandomSubset,
    isAdmin,
    isAmbassador,
    isIronPlayer,
    isMod,
    isNewMember,
    isNewUser,
    isProgrammer,
    isTourPlayer,
    search,
    shuffleArray,
    trackStats
}
