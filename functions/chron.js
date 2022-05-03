
const { Membership, Player, Role, Server } = require('../db')
const { client } = require('../static/clients.js')
const { createMembership, createPlayer } = require('./utility')

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

                const membership = await Membership.count({ where: { playerId: member.user.id, guildId: guild.id } })
                if (!membership) {
                    memberCount++
                    await createMembership(message.guild, member)
                }

                for (let j = 0; j < member._roles.length; j ++) {
                    const roleId = member._roles[j]
                    const membership = await Membership.findOne({ where: { playerId: member.user.id, guildId: guild.id } })
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

            console.log( 
                `Added the following to the database from ${server.name}:` +
                `\n- ${createCount} new ${createCount === 1 ? 'player' : 'players'}` +
                `\n- ${memberCount} new ${memberCount === 1 ? 'member' : 'members'}` +
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

module.exports = {
    conductCensus,
    getMidnightCountdown,
    updateAvatars,
    purgeEntries
}