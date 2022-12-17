


const { SlashCommandBuilder } = require('discord.js')
const { Entry, Format, Player, Server, Tournament } = require('../db')
const { askForDBName, getDeckList, postParticipant, selectTournament } = require('../functions/tournament')
const { isMod, hasPartnerAccess } = require('../functions/utility')
const { Op } = require('sequelize')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('signup')
		.setDescription('Sign-up another user for a tournament.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user you want to sign-up.')
                .setRequired(true)
        ),
	async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        if (!hasPartnerAccess(server)) return interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, interaction.member)) return interaction.reply({ content: 'You do not have permission to do that. Please type **/join** instead.'})   

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
                state: {[Op.or]: ['pending', 'standby']},
                formatName: format ? format.name : {[Op.not]: null},
                serverId: interaction.guildId
            }, 
            order: [['createdAt', 'ASC']] 
        })
        
        const user = interaction.options.getUser('user')
        const member = await interaction.guild.members.fetch(user.id)
        const player = await Player.findOne({ where: { discordId: user.id }})
        if (!player) return interaction.reply({ content: `That player is not in the database.`})
        
        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return

        const entry = await Entry.findOne({ where: { playerId: player.id, tournamentId: tournament.id }})
        if (!format) format = await Format.findOne({ where: { name: {[Op.iLike]: tournament.formatName } }})
        if (!format) return interaction.reply(`Unable to determine what format is being played in ${tournament.name}. Please contact an administrator.`)
        
        if (entry) {
            interaction.reply({ content: `Please check your DMs.\n\n(FYI: ${player.name} is already registered for ${tournament.name} ${tournament.logo})`})
        } else {
            interaction.reply({ content: `Please check your DMs.`})
        }
        
        const dbName = player.duelingBook ? player.duelingBook : await askForDBName(interaction.member, player)
        if (!dbName) return
        const { url, ydk } = await getDeckList(interaction.member, player, format, tournament.name, true)
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
              member.roles.add(server.tourRole).catch((err) => console.log(err))
              interaction.member.send({ content: `Thanks! I have all the information we need for ${player.name}.` }).catch((err) => console.log(err))
              return interaction.guild.channels.cache.get(tournament.channelId).send({ content: `A moderator signed up <@${player.discordId}> for ${tournament.name} ${tournament.logo}!`}).catch((err) => console.log(err))
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
                member.roles.add(server.tourRole).catch((err) => console.log(err))
                interaction.member.send({ content: `Thanks! I have all the information we need for ${player.name}.`}).catch((err) => console.log(err))
                return interaction.guild.channels.cache.get(tournament.channelId).send({ content: `A moderator signed up <@${player.discordId}> for ${tournament.name} ${tournament.logo}!`}).catch((err) => console.log(err))
            }
        } else {
            try {
                await entry.update({ url: url, ydk: ydk })
            } catch (err) {
                console.log(err)
                return interaction.member.send({ content: `Error: Could not access database.`}).catch((err) => console.log(err))
            } finally {
                interaction.member.send({ content: `Thanks! I have ${player.name}'s updated deck list for the tournament.` }).catch((err) => console.log(err))
                return interaction.guild.channels.cache.get(tournament.channelId).send({ content: `A moderator resubmitted <@${player.discordId}>'s deck list for ${tournament.name} ${tournament.logo}!`}).catch((err) => console.log(err))
            }
        }
    }
}