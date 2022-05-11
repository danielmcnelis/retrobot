
const axios = require('axios')
const fs = require('fs')
const { Card, Entry, Tournament, Membership, Player, Role, Server } = require('../db')
const { client } = require('../static/clients.js')
const { createMembership, createPlayer } = require('./utility')
const { Op } = require('sequelize')

// GET MIDNIGHT COUNTDOWN
const getMidnightCountdown = () => {
	const date = new Date()
	const hours = date.getHours()
	const mins = date.getMinutes()
	const minsLeftInPeriod = 60 - mins
	const hoursLeftInPeriod = 23 - hours
    return ( hoursLeftInPeriod * 60 + minsLeftInPeriod ) * 60 * 1000
}

// UPDATE AVATARS
const updateAvatars = async (client) => {
    const servers = await Server.findAll()
    for (let s = 0; s < servers.length; s++) {
        try {
            let count = 0
            const server = servers[s]
            const guild = client.guilds.cache.get(server.id)
            const membersMap = await guild.members.fetch()
            const memberIds = [...membersMap.keys()]
            
            for (let i = 0; i < memberIds.length; i++) {
                const memberId = memberIds[i]
                const avatar = membersMap.get(memberId).user.avatar
                if (!avatar) continue
    
                const player = await Player.findOne({
                    where: {
                        id: memberId,
                        avatar: {[Op.not]: avatar }
                    }
                })
    
                if (player) {
                    player.avatar = avatar
                    await player.save()
                    count++
                } else {
                    continue
                }
            }

            console.log(`updated ${count} avatars for ${server.name}`)
        } catch (err) {
            console.log(err)
        }
    }

    return setTimeout(() => updateAvatars(client), (24 * 60 * 60 * 1000))
}

// CONDUCT CENSUS
const conductCensus = async (client) => {
    // Update every player's username and tag to match their Discord account.
    // It also creates new players if they are not in the database (i.e. they joined while bot was down).
    const servers = await Server.findAll()
    for (let s = 0; s < servers.length; s++) {
        try {
            const server = servers[s]
            const guild = client.guilds.cache.get(server.id)
            const membersMap = await guild.members.fetch()
            const members = [...membersMap.values()]
            const rolesMap = guild.roles.cache
            const roles = [...rolesMap.values()].reduce((a, v) => ({ ...a, [v.id]: v.name}), {})     
            let updateCount = 0
            let createCount = 0
            let memberCount = 0
            let roleCount = 0
            let inactivatedCount = 0
            let reactivatedCount = 0

            for (let i = 0; i < members.length; i++) {
                const member = members[i]
                if (member.user.bot) continue
                const player = await Player.findOne({ where: { id: member.user.id } })
                if (player && ( player.name !== member.user.username || player.tag !== member.user.tag )) {
                    updateCount++
                    await player.update({
                        name: member.user.username,
                        tag: member.user.tag
                    })
                } else if (!player && !member.user.bot) {
                    createCount++
                    await createPlayer(member)
                }

                const membership = await Membership.count({ where: { playerId: member.user.id, serverId: guild.id } })
                if (!membership) {
                    memberCount++
                    await createMembership(guild, member)
                }

                for (let j = 0; j < member._roles.length; j ++) {
                    const roleId = member._roles[j]
                    const membership = await Membership.findOne({ where: { playerId: member.user.id, serverId: guild.id } })
                    if (!membership) break
                    const count = await Role.count({ where: { membershipId: membership.id, roleId: roleId }})
                    if (!count) {
                        await Role.create({
                            membershipId: membership.id,
                            roleId: roleId,
                            roleName: roles[roleId]
                        })

                        roleCount++
                    }
                }
            }

            const memberIds = members.map((m) => m.user.id)
            const memberships = await Membership.findAll({ where: { serverId: guild.id } }) || []
            for (let i = 0; i < memberships.length; i++) {
                try {
                    const m = memberships[i]
                    if (m.active === true && !memberIds.includes(m.playerId)) {
                        m.active = false
                        await m.save()
                        inactivatedCount++
                    } else if (m.active === false && memberIds.includes(m.playerId)) {
                        m.active = true
                        await m.save()
                        reactivatedCount++
                    }
                } catch (err) {
                    console.log(err)
                }
            }

            console.log( 
                `Updated the following in the database from ${server.name}:` +
                `\n- ${createCount} new ${createCount === 1 ? 'player' : 'players'}` +
                `\n- ${memberCount} new ${memberCount === 1 ? 'member' : 'members'}` +
                `\n- ${inactivatedCount} inactivated ${inactivatedCount === 1 ? 'member' : 'members'}` +
                `\n- ${reactivatedCount} reactivated ${reactivatedCount === 1 ? 'member' : 'members'}` +
                `\n- ${updateCount} updated ${updateCount === 1 ? 'player' : 'players'}` +
                `\n- ${roleCount} updated ${roleCount === 1 ? 'role' : 'roles'}`
            )
        } catch (err) {
            console.log(err)
        }
    }

    return setTimeout(() => conductCensus(client), (24 * 60 * 60 * 1000))
}

// PURGE ENTRIES
const purgeEntries = async () => {
    let count = 0
    const entries = await Entry.findAll({ include: Tournament })
    for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const tournament = entry.tournament
    if (tournament.state === 'complete') {
            await entry.destroy()
            count++
        }
    }

    console.log(`Purged ${count} old tournament entries from the database.`)
    return setTimeout(() => purgeEntries(), (24 * 60 * 60 * 1000))
} 

// GET LINK ARROWS
const getLinkArrows = (directionsArr = []) => {
    const arrows = []
    directionsArr.forEach((dir) => {
        let abbr = ''
        const cardinals = dir.split('-')
        cardinals.forEach((car) => {
            abbr = abbr + car.charAt(0)
        })

        arrows.push(abbr)
    })

    return arrows.join('-')
}

// GET SORT PRIORITY
const getSortPriority = (type = '') => {
    const sortPriority = type.includes('Trap') ? 11 :
        type.includes('Spell') ? 10 :
        type.includes('Link') ? 9 :
        type.includes('Pendulum') && !type.includes('Normal') ? 8 :
        type.includes('Pendulum') && type.includes('Normal') ? 7 :
        type.includes('Xyz') ? 6 :
        type.includes('Synchro') ? 5 :
        type.includes('Ritual') ? 4 :
        type.includes('Fusion') ? 3 :
        type.includes('Effect') ? 2 :
        type.includes('Normal') ? 1 :
        null

    return sortPriority
}

// GET COLOR
const getColor = (type = '') => {
    const color = type.includes('Trap') ? 'violet' :
        type.includes('Spell') ? 'green' :
        type.includes('Link') ? 'dark-blue' :
        type.includes('Pendulum') && !type.includes('Normal') ? 'orange-green' :
        type.includes('Pendulum') && type.includes('Normal') ? 'yellow-green' :
        type.includes('Xyz') ? 'black' :
        type.includes('Synchro') ? 'white' :
        type.includes('Ritual') ? 'light-blue' :
        type.includes('Fusion') ? 'purple' :
        type.includes('Effect') ? 'orange' :
        type.includes('Normal') ? 'yellow' :
        null

    return color
}

// DOWNLOAD CARD IMAGE
const downloadCardImage = async (id) => {
    const {data} = await axios({
        method: 'GET',
        url: `https://storage.googleapis.com/ygoprodeck.com/pics/${id}.jpg`,
        responseType: 'stream'
    })

    data.pipe(fs.createWriteStream(`../formatlibrary/public/images/cards/${id}.jpg`))
}

// DOWNLOAD NEW CARDS
const downloadNewCards = async () => {
    let b = 0
    let c = 0
    const { data } = await axios.get('https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes')
    for (let i = 0; i < data.data.length; i++) {
        const datum = data.data[i]
        if (datum.type === 'Token' || datum.type === 'Skill Card') continue
        const id = datum.id.toString()
        if (
            id === '501000000' || 
            id === '501000001' || 
            id === '501000002' || 
            id === '501000003' || 
            id === '501000004' || 
            id === '501000006' || 
            id === '501000007' || 
            id === '111000561'
        ) continue

        try {
            const card = await Card.findOne({
                where: {
                    [Op.or]: [
                        {ypdId: id},
                        {name: datum.name}
                    ]
                    
                }
            })
    
            if (!card) {
                b++
                let konamiCode = id
                while (konamiCode.length < 8) konamiCode = '0' + konamiCode
                const type = datum.type
                const category = type.includes('Monster') ? 'Monster' :
                    type.includes('Spell') ? 'Spell' :
                    type.includes('Trap') ? 'Trap' :
                    null

                if (!category) console.log(`No category for ${datum.type}`)
                        
                await Card.create({
                    name: datum.name,
                    konamiCode: konamiCode,
                    ypdId: id,
                    tcgLegal: !!datum.misc_info[0].tcg_date,
                    ocgLegal: !!datum.misc_info[0].ocg_date,
                    category: category,
                    icon: category !== 'Monster' ? datum.race : null,
                    normal: category === 'Monster' && type.includes('Normal'),
                    effect: category === 'Monster' &&
                        !type.includes('Normal') && 
                        (
                            type.includes('Effect') || 
                            type.includes('Flip') || 
                            type.includes('Gemini') || 
                            type.includes('Spirit') || 
                            type.includes('Toon') || 
                            type.includes('Union') || 
                            type.includes('Tuner')
                        ),
                    fusion: category === 'Monster' && type.includes('Fusion'),
                    ritual: category === 'Monster' && type.includes('Ritual'),
                    synchro: category === 'Monster' && type.includes('Synchro'),
                    xyz: category === 'Monster' && type.includes('Xyz'),
                    pendulum: category === 'Monster' && type.includes('Pendulum'),
                    link: category === 'Monster' && type.includes('Link'),
                    flip: category === 'Monster' && type.includes('Flip'),
                    gemini: category === 'Monster' && type.includes('Gemini'),
                    spirit: category === 'Monster' && type.includes('Spirit'),
                    toon: category === 'Monster' && type.includes('Toon'),
                    tuner: category === 'Monster' && type.includes('Tuner'),
                    union: category === 'Monster' && type.includes('Union'),
                    attribute: datum.attribute,
                    type: category === 'Monster' ? datum.race : null,
                    level: category === 'Monster' && !type.includes('Link') ? datum.level : null,
                    rating: category === 'Monster' && type.includes('Link') ? datum.linkval : null,
                    arrows: category === 'Monster' && type.includes('Link') ? getLinkArrows(datum.linkmarkers) : null,
                    scale: category === 'Monster' && type.includes('Pendulum') ? datum.scale : null,
                    atk: category === 'Monster' ? datum.atk : null,
                    def: category === 'Monster' && !type.includes('Link') ? datum.def : null,
                    description: datum.desc,
                    tcgDate: datum.misc_info[0].tcg_date ? datum.misc_info[0].tcg_date : null,
                    ocgDate: datum.misc_info[0].ocg_date ? datum.misc_info[0].ocg_date : null,
                    extraDeck: type.includes('Fusion') || type.includes('Synchro') || type.includes('Xyz') || type.includes('Link'),
                    color: getColor(datum.type),
                    sortPriority: getSortPriority(datum.type)
                })
                console.log(`New card: ${datum.name} (TCG Date: ${datum.misc_info[0].tcg_date}, OCG Date: ${datum.misc_info[0].ocg_date})`)
                await downloadCardImage(datum.id)
                console.log(`IMAGE SAVED`)
            } else if (card && (card.name !== datum.name)) {
                c++
                card.name = datum.name
                card.description = datum.desc
                await card.save()
                console.log(`New name: ${card.name} is now: ${datum.name}`)
            }
        } catch (err) {
            console.log(err)
        }
    }

    console.log(`Found ${b} new cards and ${c} new names.`)
    return setTimeout(() => downloadNewCards(), (24 * 60 * 60 * 1000))
}

module.exports = {
    conductCensus,
    downloadNewCards,
    getMidnightCountdown,
    updateAvatars,
    purgeEntries
}
