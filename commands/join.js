

const { SlashCommandBuilder } = require('discord.js')
const { Entry, Format, Player, Server, Tournament } = require('../../formatlibrary/libs/models/src/lib/index.js')
const { askForDBName, getDeckList, postParticipant, selectTournament } = require('../functions/tournament')
const { drawDeck, hasPartnerAccess } = require('../functions/utility')
const { Op } = require('sequelize')
const emojis = require('../static/emojis.json')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('join')
		.setDescription('Join a tournament. ✅'),
	async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        if (!hasPartnerAccess(server)) return interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})

        let format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })
        
        const tournaments = await Tournament.findAll({ 
            where: { 
                state: 'pending',
                formatName: format ? format.name : {[Op.not]: null},
                serverId: interaction.guildId
            }, 
            order: [['createdAt', 'ASC']] 
        })
        
        const player = await Player.findOne({ where: { discordId: interaction.user.id }})
        if (!player) return interaction.reply({ content: `You are not in the database.`})
        
        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return

        const entry = await Entry.findOne({ where: { playerId: player.id, tournamentId: tournament.id }})
        if (!format) format = await Format.findOne({ where: { name: {[Op.iLike]: tournament.formatName } }})
        if (!format) return interaction.reply(`Unable to determine what format is being played in ${tournament.name}. Please contact an administrator.`)
        interaction.reply({ content: `Please check your DMs.` })
        
        const dbName = player.duelingBook ? player.duelingBook : await askForDBName(interaction.member, player)
        if (!dbName) return

        const { url, ydk } = await getDeckList(interaction.member, player, format)
        if (!url) return

        if (!entry) {
            try {                                
              const { participant } = await postParticipant(server, tournament, player)
              if (!participant) return interaction.member.send({ content: `Error: Unable to register on Challonge for ${tournament.name} ${tournament.logo}.`})
              
              await Entry.create({
                  playerName: player.name,
                  url: url,
                  ydk: ydk,
                  participantId: participant.id,
                  playerId: player.id,
                  tournamentId: tournament.id
              })
        
            } catch (err) {
              console.log(err)
              return interaction.member.send({ content: `Error: Could not access database.`})
            } finally {
              const deckAttachments = await drawDeck(ydk) || []
              interaction.member.roles.add(server.tourRole).catch((err) => console.log(err))
              interaction.member.send({ content: `Thanks! I have all the information we need from you. Good luck in the tournament! FYI, this is the deck you submitted:`, files: [...deckAttachments] }).catch((err) => console.log(err))
              return interaction.guild.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> is now registered for ${tournament.name} ${tournament.logo}!`}).catch((err) => console.log(err))
            }
        } else if (entry.active === false) {
            try {                                
                const { participant } = await postParticipant(server, tournament, player)
                if (!participant) return interaction.member.send({ content: `Error: Unable to register on Challonge for ${tournament.name} ${tournament.logo}.`})
                
                await entry.update({
                    url: url,
                    ydk: ydk,
                    participantId: participant.id,
                    active: true
                })
            } catch (err) {
                console.log(err)
                return interaction.member.send({ content: `Error: Could not access database.`})
            } finally {
                const deckAttachments = await drawDeck(ydk) || []
                interaction.member.roles.add(server.tourRole).catch((err) => console.log(err))
                interaction.member.send({ content: `Thanks! I have all the information we need from you. Good luck in the tournament! FYI, this is the deck you submitted:`, files: [...deckAttachments] }).catch((err) => console.log(err))
                return interaction.guild.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> is now registered for ${tournament.name} ${tournament.logo}!`}).catch((err) => console.log(err))
            }
        } else {
            try {
                await entry.update({ url: url, ydk: ydk })
            } catch (err) {
                console.log(err)
                return interaction.member.send({ content: `Error: Could not access database.`}).catch((err) => console.log(err))
            } finally {
                const deckAttachments = await drawDeck(ydk) || []
                interaction.member.send({ content: `Thanks! I have your updated deck list for the tournament:`, files: [...deckAttachments] }).catch((err) => console.log(err))
                return interaction.guild.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> resubmitted their deck list for ${tournament.name} ${tournament.logo}!`}).catch((err) => console.log(err))
            }
        }
	}
}
