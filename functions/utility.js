
//UTILITY FUNCTIONS

//MODULE IMPORTS
const Canvas = require('canvas')
const fs = require('fs')
const Discord = require('discord.js')
const { Op } = require('sequelize')

//DATABASE IMPORTS
const { Card, Info, Membership, Player, Print, Role, Set, Stats, Status } = require('../db/index.js')

//STATIC IMPORTS
const { mad, sad, rock, bronze, silver, gold, platinum, diamond, master, legend, god, ATK, DEF,
    DARK, LIGHT, EARTH, WIND, WATER, DIVINE, FIRE, Aqua, Beast, BeastWarrior, Continuous, 
    Counter, Cyberse, Dinosaur, DivineBeast, Dragon, Equip, Fairy, Field, Fiend, Fish, 
    Insect, Link, Machine, Normal, Plant, Psychic, Pyro, QuickPlay, Rank, Reptile, 
    Ritual, Rock, Scale, SeaSerpent, Spell, Spellcaster, Star, Thunder, Trap, Warrior, 
    WingedBeast, Wyrm, Zombie, forbidden, limited, semi, unlimited
 } = require('../static/emojis')
const rarities = require('../static/rarities.json')
const roles = require('../static/roles.json')

//DATE TO SIMPLE
const dateToSimple = (date) => {
    const year = typeof date === 'string' ? date.slice(2, 4) : date.getFullYear().slice(2, 4)
    const month = typeof date === 'string' ? parseInt(date.slice(5, 7), 10) : date.getMonth() + 1
    const day = typeof date === 'string' ? parseInt(date.slice(8, 10), 10) : date.getDate()
    const simple = `${month}/${day}/${year}`
    return simple
}

//DATE TO VERBOSE
const dateToVerbose = (date, long = true, ordinal = true, includeYear = true) => {
    const year = typeof date === 'string' ? date.slice(0, 4) : date.getFullYear()
    const longMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    const shortMonths = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."]
    const month = typeof date === 'string' ? parseInt(date.slice(5, 7), 10) - 1 : date.getMonth()
    const monthStr = long ? longMonths[month] : shortMonths[month]
    const day = typeof date === 'string' ? parseInt(date.slice(8, 10), 10) : date.getDate()
    const dayStr = ordinal ? ordinalize(day) : day
    const verbose = includeYear ? `${monthStr} ${dayStr}, ${year}` :  `${monthStr} ${dayStr}`
    return verbose
}

const ordinalize = (int) => {
    const suffixes = ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"]
    switch (int % 100) {
    case 11:
    case 12:
    case 13:
        return int + "th"
    default:
        return int + suffixes[int % 10]
    }
}

//URLIZE
const urlize = (str) => str.replace(/[\s]/g, '-').toLowerCase()

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
const search = async (query, fuzzyCards, format) => {
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

    const status = format ? await Status.findOne({ 
        where: { 
            banlist: format.banlist,
            name: {
                [Op.iLike]: card_name
            }
        }
    }) : null

    const print = await Print.findOne({
        where: {
            cardId: card.id
        },
        include: Set,
        order: [[Set, 'tcgDate', 'ASC'], ['marketPrice', 'DESC']]
    })

    const firstPrint = print ? `${rarities[print.rarity]} ${print.set.setName}` : null 

    const legal = format && card.tcgDate && (card.tcgDate <= format.date)
    const position = legal && status ? status.restriction :
        legal && !status ? 'unlimited' :
        'not legal'

    const indicator = position === 'semi-limited' ? semi :
        position === 'limited' ? limited :
        position === 'unlimited' ? unlimited :
        forbidden

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

    const releaseDate = card.tcgDate ? dateToVerbose(card.tcgDate, true, false, true) : 'OCG Only'
    let labels = [
		`\nRelease Date: ${releaseDate}`,
		`\nFirst Print: ${firstPrint || 'OCG Only'}`,
        `${format && format.name ? `\n${format.name} ${format.emoji} Status: ${capitalize(position, true)} ${indicator}` : ''}`
    ]

    if (card.category === 'Monster') {
        labels = [
            `Attribute: ${card.attribute} ${eval(card.attribute)}`,
            `\n${card.xyz ? `Rank: ${card.level} ${Rank}` : card.link ? `Link Rating: ${card.rating} ${Link}` : `Level: ${card.level} ${Star}`}`,
            ...labels,
            `\n**[** ${card.type} ${eval(card.type.replace(/[^\ws]/gi, ""))} / ${classes.join(" / ")} **]**`
        ]
    } else {
        labels = [
            `Card: ${card.category} ${eval(card.category)}`,
            `\nCategory: ${card.icon} ${eval(card.icon.replace(/[^\ws]/gi, ""))}`,
            ...labels
        ]
    }

	const stats = card.category === "Monster" ? 
			`ATK: ${card.atk === null ? '?' : card.atk} ${ATK}` + 
			` ${!card.link ? `DEF: ${card.def === null ? '?' : card.def} ${DEF}` : ''}` :
			null
	
	const attachment = fs.existsSync(`../formatlibrary/public/images/cards/${card.ypdId}.jpg`) ?
		new Discord.MessageAttachment(`../formatlibrary/public/images/cards/${card.ypdId}.jpg`, `${card.ypdId}.jpg`) :
		false

	const thumbnail = attachment ? `attachment://${card.ypdId}.jpg` : `https://ygoprodeck.com/pics/${card.ypdId}.jpg`    
    const cardEmbed = new Discord.MessageEmbed()
	cardEmbed.setColor(color)
	cardEmbed.setTitle(card.name)
	cardEmbed.setThumbnail(thumbnail)
	cardEmbed.setDescription(`${labels.join('')}\n\n${card.description}${stats ? `\n\n${stats}` : ''}\n\nhttps://formatlibrary.com/cards/${card.name.replace(/ /g, '_')}`)
	return { cardEmbed, attachment }
}

const drawDeck = async (ydk) => {
    console.log('ydk', ydk)
    const mainArr = ydk.split('#extra')[0] || []
    const extraArr = ydk.split('#extra')[1].split('!side')[0] || []
    const sideArr = ydk.split('!side')[1] || []
    const main = []
    const side = []
    const extra = []
    console.log('mainArr', mainArr)
    console.log('extraArr', extraArr)
    console.log('sideArr', sideArr)
    
    for (let i = 0; i < mainArr.length; i++) {
        const name = mainArr[i]
        const card = await Card.findOne({ where: { name: name }})
        if (!card) continue
        main.push(card)
    }

    console.log('main.length', main.length)

    for (let i = 0; i < sideArr.length; i++) {
        const name = sideArr[i]
        const card = await Card.findOne({ where: { name: name }})
        if (!card) continue
        side.push(card)
    }
    console.log('side.length', side.length)

    for (let i = 0; i < extraArr.length; i++) {
        const name = extraArr[i]
        const card = await Card.findOne({ where: { name: name }})
        if (!card) continue
        extra.push(card)
    }
    console.log('extra.length', extra.length)

    main.sort((a, b) => {
        if (a.sortPriority > b.sortPriority) {
            return 1
        } else if (b.sortPriority > a.sortPriority) {
            return -1
        } else if (a.name > b.name) {
            return 1
        } else if (b.name > a.name) {
            return -1
        } else {
            return false
        }
    })

    extra.sort((a, b) => {
        if (a.sortPriority > b.sortPriority) {
            return 1
        } else if (b.sortPriority > a.sortPriority) {
            return -1
        } else if (a.name > b.name) {
            return 1
        } else if (b.name > a.name) {
            return -1
        } else {
            return false
        }
    })

    side.sort((a, b) => {
        if (a.sortPriority > b.sortPriority) {
            return 1
        } else if (b.sortPriority > a.sortPriority) {
            return -1
        } else if (a.name > b.name) {
            return 1
        } else if (b.name > a.name) {
            return -1
        } else {
            return false
        }
    })

    const mainAttachment = await makeCanvasAttachment(main, 57, 80, 10, 'main')
    const extraAttachment = await makeCanvasAttachment(extra, 38, 53, 15, 'extra')
    const sideAttachment = await makeCanvasAttachment(side, 38, 53, 15, 'side')

    console.log('!!mainAttachment', !!mainAttachment)
    console.log('!!extraAttachment', !!extraAttachment)
    console.log('!!sideAttachment', !!sideAttachment)
    return [
        mainAttachment,
        extraAttachment,
        sideAttachment
    ]
}

const makeCanvasAttachment = async (cardsArr = [], width = 57, height = 80, cardsPerRow = 10, name = 'main') => {
    console.log(name, 'cardsArr.length', cardsArr.length)
    console.log(width, 'x', height, 'x', cardsPerRow)
    try {
        const rows = Math.ceil(cardsArr.length / cardsPerRow)
        const canvas = Canvas.createCanvas(width * 10, height * rows)
        const context = canvas.getContext('2d')

        for (let i = 0; i < cardsArr.length; i++) {
            try {
                const card = cardsArr[i]
                const row = Math.floor(i / cardsPerRow)
                const col = i % cardsPerRow
                const image = await Canvas.loadImage(`https://formatlibrary.com/cards/${card.ypdId}.jpg`)
                console.log('!!image', !!image)
                context.drawImage(image, width * col, row * height, width, height)
            } catch (err) {
                console.log(err)
            }
        }

        console.log('!!canvas', !!canvas)
        const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `${name}Deck.png`)
        console.log('!!attachment', !!attachment)
        return attachment
    } catch (err) {
        console.log(err)
        return null
    }
}

//ASSIGN ROLES
const assignRoles = async (guild, member) => {
    const membership = await Membership.findOne({ where: { playerId: member.user.id, guildId: guild.id }})
    membership.active = true
    await membership.save()
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

//HAS AFFILIATE ACCESS?
const hasAffiliateAccess = (server) => server && (server.access === 'affiliate' || server.access === 'partner' || server.access === 'full')

//HAS PARTNER ACCESS?
const hasPartnerAccess = (server) => server && (server.access === 'partner' || server.access === 'full')

//HAS FULL ACCESS?
const hasFullAccess = (server) => server && server.access === 'full'

//IS PROGRAMMER?
const isProgrammer = (member) => member && member.user.id === '194147938786738176'

//IS ADMIN?
const isAdmin = (server, member) => server && member && member.roles.cache.some(role => role.id === roles[server.name].adminRole)

//IS MOD?
const isMod = (server, member) => server && member && member.roles.cache.some(role => role.id === roles[server.name].modRole || role.id === roles[server.name].adminRole)

//IS IRON PLAYER?
const isIronPlayer = (server, member) => server && member && member.roles.cache.some(role => role.id === roles[server.name].ironRole)

//IS NEW MEMBER?
const isNewMember = async (server, guildId, playerId) => server.access !== 'limited' && !await Membership.count({ where: { guildId, playerId } })

//IS NEW USER?
const isNewUser = async (server, id) => server.access !== 'limited' && !await Player.count({ where: { id } })

//IS TOURNAMENT PLAYER?
const isTourPlayer = (server, member) => server && member && member.roles.cache.some(role => role.id === roles[server.name].tourRole)

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
const trackStats = async (server, id, format) => {
    if (await isNewUser(server, id)) {
        const member = { user: { id: id } }
        await createPlayer(server, member)
        return trackStats(server, id, format)
    } else {
        await Stats.create({
            playerId: id,
            format: format,
            serverId: '414551319031054346'
        })
    }
}

module.exports = {
    assignRoles,
    capitalize,
    convertArrayToObject,
    createMembership,
    createPlayer,
    dateToSimple,
    dateToVerbose,
    drawDeck,
    fetchCardNames,
    generateRandomString,
    getMedal,
    getRandomElement,
    getRandomSubset,
    isAdmin,
    isIronPlayer,
    isMod,
    isNewMember,
    isNewUser,
    isProgrammer,
    isTourPlayer,
    hasAffiliateAccess,
    hasPartnerAccess,
    hasFullAccess,
    ordinalize,
    search,
    shuffleArray,
    trackStats,
    urlize
}
