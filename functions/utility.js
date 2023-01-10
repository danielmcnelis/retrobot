
//UTILITY FUNCTIONS

//MODULE IMPORTS
const Canvas = require('canvas')
const { ActionRowBuilder, EmbedBuilder, AttachmentBuilder, StringSelectMenuBuilder } = require('discord.js')
const { Op } = require('sequelize')

//DATABASE IMPORTS
const { Card, Membership, Player, Print, Role, Set, Stats, Status, Tournament } = require('../db/index.js')

//STATIC IMPORTS
const emojis = require('../static/emojis.json')
const rarities = require('../static/rarities.json')

//DATE TO SIMPLE
const dateToSimple = (date = 'N/A') => {
    const year = typeof date === 'string' ? date.slice(2, 4) : date.getFullYear().slice(2, 4)
    const month = typeof date === 'string' ? parseInt(date.slice(5, 7), 10) : date.getMonth() + 1
    const day = typeof date === 'string' ? parseInt(date.slice(8, 10), 10) : date.getDate()
    const simple = `${month}/${day}/${year}`
    return simple
}

//DATE TO VERBOSE
const dateToVerbose = (date = 'N/A', long = true, ordinal = true, includeYear = true) => {
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

    const legal = format && card.tcgDate && (card.tcgDate <= format.date || format.name === 'Traditional' || format.name === 'Current')
    const position = format && format.name === 'Traditional' && legal && status && status.restriction === 'Forbidden' ? 'limited' :
        legal && status ? status.restriction :
        legal && !status ? 'unlimited' :
        'not legal'

    const indicator = position === 'semi-limited' ? emojis.semi :
        position === 'limited' ? emojis.limited :
        position === 'unlimited' ? emojis.unlimited :
        emojis.forbidden

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
            `Attribute: ${card.attribute} ${emojis[card.attribute]}`,
            `\n${card.xyz ? `Rank: ${card.level} ${emojis.Rank}` : card.link ? `Link Rating: ${card.rating} ${emojis.Link}` : `Level: ${card.level} ${emojis.Star}`}`,
            ...labels,
            `\n**[** ${card.type} ${emojis[card.type.replace(/[^\ws]/gi, "")]} / ${classes.join(" / ")} **]**`
        ]
    } else {
        labels = [
            `Card: ${card.category} ${emojis[card.category]}`,
            `\nCategory: ${card.icon} ${emojis[card.icon.replace(/[^\ws]/gi, "")]}`,
            ...labels
        ]
    }

	const stats = card.category === "Monster" ? 
			`ATK: ${card.atk === null ? '?' : card.atk} ${emojis.ATK}` + 
			` ${!card.link ? `DEF: ${card.def === null ? '?' : card.def} ${emojis.DEF}` : ''}` :
			null
	
	const attachment = new AttachmentBuilder(`https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`, { name: `${card.ypdId}.jpg` })
	const thumbnail = attachment ? `attachment://${card.ypdId}.jpg` : `https://ygoprodeck.com/pics/${card.ypdId}.jpg`    
    
    const cardEmbed = new EmbedBuilder()
        .setColor(color)
	    .setTitle(card.name)
	    .setThumbnail(thumbnail)
	    .setDescription(
            `${labels.join('')}` + 
            `\n\n${card.description}` +
            `${stats ? `\n\n${stats}` : ''}` +
            `\n\nhttps://formatlibrary.com/cards/${
                card.name.replaceAll('%', '%25')
                    .replaceAll('/', '%2F')
                    .replaceAll(' ', '_')
                    .replaceAll('#', '%23')
                    .replaceAll('?', '%3F')
            }`
        )
	return { cardEmbed, attachment }
}

const drawDeck = async (ydk) => {
    const mainArr = ydk.split('#main')[1].split('#extra')[0].split('\n').filter((e) => e.length) || []
    const extraArr = ydk.split('#extra')[1].split('!side')[0].split('\n').filter((e) => e.length) || []
    const sideArr = ydk.split('!side')[1].split('\n').filter((e) => e.length) || []
    const main = []
    const side = []
    const extra = []
    
    for (let i = 0; i < mainArr.length; i++) {
        let konamiCode = mainArr[i]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode
        const card = await Card.findOne({ where: { konamiCode: konamiCode }})
        if (!card) continue
        main.push(card)
    }

    for (let i = 0; i < sideArr.length; i++) {
        let konamiCode = sideArr[i]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode
        const card = await Card.findOne({ where: { konamiCode: konamiCode }})
        if (!card) continue
        side.push(card)
    }

    for (let i = 0; i < extraArr.length; i++) {
        let konamiCode = extraArr[i]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode
        const card = await Card.findOne({ where: { konamiCode: konamiCode }})
        if (!card) continue
        extra.push(card)
    }

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

    return [
        mainAttachment,
        extraAttachment,
        sideAttachment
    ]
}

const makeCanvasAttachment = async (cardsArr = [], width = 57, height = 80, cardsPerRow = 10, name = 'main') => {
    try {
        const rows = Math.ceil(cardsArr.length / cardsPerRow)
        const canvas = Canvas.createCanvas(width * cardsPerRow, height * rows)
        const context = canvas.getContext('2d')

        for (let i = 0; i < cardsArr.length; i++) {
            try {
                const card = cardsArr[i]
                const row = Math.floor(i / cardsPerRow)
                const col = i % cardsPerRow
                const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`)
                context.drawImage(image, width * col, row * height, width, height)
            } catch (err) {
                console.log(err)
            }
        }

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: `${name}Deck.png` })
        return attachment
    } catch (err) {
        console.log(err)
        return null
    }
}

//ASSIGN ROLES
const assignRoles = async (guild, member) => {
    const membership = await Membership.findOne({ where: { '$player.discordId$': member.user.id, serverId: guild.id }, include: Player })
    if (!membership) return
    membership.active = true
    await membership.save()
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
const capitalize = (str = '', eachWord = false) => {
    if (!str) return
    if (eachWord) {
      return str.split(' ')
        .map((s) => capitalize(s))
        .join(' ')
        .split('-')
        .map((s) => capitalize(s))
        .join('-')
    } else {
      const charZero = str.charAt(0) || ''
      return charZero.toUpperCase() + str.slice(1)
    }
}

//CONVERT ARRAY TO OBJECT
const convertArrayToObject = (arr = []) => {
    const obj = {}
    arr.forEach(e => obj[e] ? obj[e]++ : obj[e] = 1)
    return obj
}

//CREATE PLAYER
const createPlayer = async (member) => {
    if (member && !member.user.bot) {
        try {
            const id = await Player.generateId()
            await Player.create({
                id: id,
                name: `${member.user.username}`,
                discordId: `${member.user.id}`,
                discriminator: `${member.user.discriminator}`
            })
        } catch (err) {
            console.log(err)
        }
    }
}

//CREATE MEMBERSHIP
const createMembership = async (guild, member) => {
    try {
        const count = await Player.count({ where: { discordId: member.user.id }})
        if (!count) await createPlayer(member)
        const player = await Player.findOne({ where: { discordId: member.user.id }})

        await Membership.create({
            guildName: guild.name,
            playerId: player.id,
            serverId: guild.id
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
        return !stats ? `Gold ${emojis.gold}`
        : stats <= 230 ? `Tilted ${emojis.mad}`
        : (stats > 230 && stats <= 290) ?  `Chump ${emojis.sad}`
        : (stats > 290 && stats <= 350) ?  `Rock ${emojis.rock}`
        : (stats > 350 && stats <= 410) ?  `Bronze ${emojis.bronze}`
        : (stats > 410 && stats <= 470) ?  `Silver ${emojis.silver}`
        : (stats > 470 && stats <= 530) ?  `Gold ${emojis.gold}`
        : (stats > 530 && stats <= 590) ?  `Platinum ${emojis.platinum}`
        : (stats > 590 && stats <= 650) ?  `Diamond ${emojis.diamond}`
        : (stats > 650 && stats <= 710) ?  `Master ${emojis.master}`
        : (stats > 710 && stats <= 770) ?  `Legend ${emojis.legend}`
        : (stats > 770 && stats <= 830) ? `Deity ${emojis.god}`
        : `Ascended ${emojis.treeborn}`
    } else {
        return !stats ? emojis.gold
        : stats <= 230 ? emojis.mad
        : (stats > 230 && stats <= 290) ? emojis.sad
        : (stats > 290 && stats <= 350) ? emojis.rock
        : (stats > 350 && stats <= 410) ? emojis.bronze
        : (stats > 410 && stats <= 470) ? emojis.silver
        : (stats > 470 && stats <= 530) ? emojis.gold
        : (stats > 530 && stats <= 590) ? emojis.platinum
        : (stats > 590 && stats <= 650) ? emojis.diamond
        : (stats > 650 && stats <= 710) ? emojis.master
        : (stats > 710 && stats <= 770) ? emojis.legend
        : (stats > 770 && stats <= 830) ? emojis.deity
        : emojis.treeborn
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
const isAdmin = (server, member) => (server && member && member._roles.includes(server.adminRole)) || member.user.id === '194147938786738176'

//IS MOD?
const isMod = (server, member) => (server && member && member._roles.includes(server.modRole || server.adminRole)) || member.user.id === '194147938786738176'

//IS IRON PLAYER?
const isIronPlayer = (server, member) => server && member && member._roles.includes('948006324237643806')

//IS NEW MEMBER?
const isNewMember = async (serverId, discordId) => !await Membership.count({ where: { serverId, '$player.discordId$': discordId }, include: Player })

//IS NEW USER?
const isNewUser = async (discordId) => !await Player.count({ where: { discordId: discordId } })

//IS TOURNAMENT PLAYER?
const isTourPlayer = (server, member) => server && member && member._roles.includes(server.tourRole)

// SELECT MATCH
const selectMatch = async (interaction, matches) => {
    if (matches.length === 0) return false
    if (matches.length === 1) return matches[0]

    const options = matches.map((match, index) => {
        return {
            label: `(${index + 1}) ${match.winner} > ${match.loser}`,
            value: `${matches[index].id}`,
        }
    })

    const row = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select')
                .setPlaceholder('Nothing selected')
                .addOptions(...options),
        )

    await interaction.reply({ content: `Please select a match to undo:`, components: [row] })
}

// SET TIMERS
const setTimers = async (client) => {
    const now = new Date()

    const tournaments = await Tournament.findAll({
        where: {
            deadline: {[Op.not]: null},
            state: 'underway'
        }
    })

    for (let i = 0; i < tournaments.length; i++) {
        try {
            const tournament = tournaments[i]
            const timeRemaining = tournament.deadline - now
            if (timeRemaining < 0) continue
            const guild = client.guilds.cache.get(tournament.serverId)
            const channel = guild.channels.cache.get(tournament.channelId)

            setTimeout(() => {
                return channel.send(`${emojis.high_alert} **Attention: ${tournament.name} Participants!** ${emojis.high_alert} Time is up in the round! ${emojis.vince}`)
            }, timeRemaining)
        } catch (err) {
            console.log(err)
        }
    }
}

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
    if (await isNewUser(id)) {
        const member = { user: { id: id } }
        await createPlayer(member)
        return trackStats(server, id, format)
    } else {
        await Stats.create({
            playerId: id,
            format: format,
            serverId: '414551319031054346',
            internal: server.internalLadder
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
    selectMatch,
    setTimers,
    shuffleArray,
    trackStats,
    urlize
}
