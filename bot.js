
// RETROBOT - A RANKINGS & TOURNAMENT MANAGEMENT DISCORD BOT

// MODULE IMPORTS
const { ActionRowBuilder, Collection, Events, StringSelectMenuBuilder } = require('discord.js');
const FuzzySet = require('fuzzyset')

// DATABASE IMPORTS 
const { Membership, Player, Server } = require('./db/index.js')

// FUNCTION IMPORTS
const { assignTourRoles, conductCensus, downloadNewCards, getMidnightCountdown, markInactives, purgeEntries, purgeRatedDecks, purgeTourRoles, updateAvatars, updateSets, updateServers } = require('./functions/chron.js')
const { assignRoles, createMembership, createPlayer, fetchCardNames, hasAffiliateAccess, hasPartnerAccess, isNewMember, isNewUser, setTimers } = require('./functions/utility.js')
const { undoMatch } = require('./functions/undo')
const { closeTournament, openTournament, sendDeck } = require('./functions/tournament')

// STATIC IMPORTS
const { client } = require('./static/clients.js')
const emojis = require('./static/emojis.json')
const commands = require('./commands')
client.commands = new Collection()
Object.values(commands).forEach((command) => {
    console.log('Setting command.data.name', command.data.name)
    client.commands.set(command.data.name, command)
})


// GLOBAL VARIABLES
const fuzzyCards = FuzzySet([], false)

// READY
client.on('ready', async() => {
    console.log('RetroBot is online!')
    try {
        await setTimers(client)
    } catch (err) {
        console.log(err)
    }

    try {
        const names = await fetchCardNames()
        names.forEach((card) => fuzzyCards.add(card))
    } catch (err) {
        console.log(err)
    }

    const midnightCountdown = getMidnightCountdown()
    setTimeout(() => purgeEntries(), midnightCountdown)
    setTimeout(() => purgeTourRoles(client), midnightCountdown + (0.2 * 60 * 1000))
    setTimeout(() => assignTourRoles(client), midnightCountdown + (0.4 * 60 * 1000))
    setTimeout(() => markInactives(), midnightCountdown + (0.6 * 60 * 1000))
    setTimeout(() => updateServers(client), midnightCountdown + (0.8 * 60 * 1000))
    setTimeout(() => updateSets(), midnightCountdown + (1 * 60 * 1000))
    setTimeout(() => downloadNewCards(), midnightCountdown + (2 * 60 * 1000))
    setTimeout(() => conductCensus(client), midnightCountdown + (3 * 60 * 1000))
    setTimeout(() => updateAvatars(client), midnightCountdown + (10 * 60 * 1000))
    setTimeout(() => purgeRatedDecks(), midnightCountdown + (12 * 60 * 1000))
})

// COMMANDS
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return

	const command = interaction.client.commands.get(interaction.commandName)

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`)
		return
	}

	try {
        if (command.data.name === 'search') {
            return command.execute(interaction, fuzzyCards)
        } else {
            return command.execute(interaction)
        }
	} catch (error) {
		console.error(error)
		return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
	}
})

// SELECT MENUS
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isStringSelectMenu()) return
    
    const commandName = interaction.commandName || interaction.message.interaction.commandName
	const command = interaction.client.commands.get(commandName)

	try {
        if (command.data.name === 'undo') {
            const matchId = interaction.values[0]
            await undoMatch(interaction.channel, matchId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'deck') {
            const entryId = interaction.values[0]
            await sendDeck(interaction, entryId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'close') {
            const tournamentId = interaction.values[0]
            await closeTournament(interaction, tournamentId)
            return interaction.message.edit({components: []})
        } else if (command.data.name === 'open') {
            const tournamentId = interaction.values[0]
            await openTournament(interaction, tournamentId)
            return interaction.message.edit({components: []})
        } else {
            return
        }
	} catch (error) {
		console.error(error)
		return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
	}
})

// WELCOME
client.on('guildMemberAdd', async (member) => {    
    console.log('guildMemberAdd')
    try {
        const guild = member.guild
        const server = await Server.findOne({ where: { id: guild.id }})
        if (!server || !hasAffiliateAccess(server)) return
        const channel = guild.channels.cache.get(server.welcomeChannel)
        if (await isNewUser(member.user.id)) await createPlayer(member) 
        if (await isNewMember(guild.id, member.user.id)) {
            await createMembership(guild, member)
            if (!channel) return
            return channel.send({ content: `${member}, Welcome to the ${guild.name} ${server.logo} Discord server. ${server.emoji|| emojis.legend}`})
        } else {
            await assignRoles(guild, member)
            if (!channel) return
            return channel.send({ content: `${member}, Welcome back to the ${guild.name} ${server.logo} Discord server! We missed you. ${emojis.soldier}`})
        }
    } catch (err) {
        console.log(err)
    }
})
    
// GOODBYE
client.on('guildMemberRemove', async (member) => {
    console.log('guildMemberRemove')
    try {
        const guild = member.guild
        const server = await Server.findOne({ where: { id: guild.id }})
        if (!server || !hasPartnerAccess(server)) return
        const channel = guild.channels.cache.get(server.welcomeChannel)
        channel.send({ content: `Oh dear. ${member.user.username} has left the server. ${emojis.sad}`})
        const membership = await Membership.findOne({ where: { '$player.discordId$': member.user.id, serverId: guild.id }, include: Player })
        membership.active = false
        await membership.save()
    } catch (err) {
        console.log(err)
    }
})