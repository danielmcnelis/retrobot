


const { SlashCommandBuilder } = require('discord.js')
const { Format, Server, Tournament } = require('.././db/index.js')
const emojis = require('../static/emojis.json')
const { isMod, hasPartnerAccess } = require('../functions/utility')
const { sendPairings, selectTournament } = require('../functions/tournament')
const { Op } = require('sequelize')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settimer')
        .setDescription('Set the timer for the round. ⌛')
		.addNumberOption(num =>
            num
                .setName('hours')
                .setDescription('The hours remaining.')
                .setRequired(true)
        )
		.addNumberOption(num =>
            num
                .setName('minutes')
                .setDescription('The minutes remaining.')
                .setRequired(true)
        ),
    async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
        
        if (!hasPartnerAccess(server)) return interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, interaction.member)) return interaction.reply({ content: 'You do not have permission to do that.'})

        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })
        
        const tournaments = await Tournament.findAll({ 
            where: { 
                state: 'underway',
                formatName: format ? format.name : {[Op.not]: null},
                serverId: interaction.guildId
            },
            order: [['createdAt', 'ASC']]
        })

        if (!tournaments.length && format) return interaction.reply({ content: `There are no active ${format.name} ${server.emoji || format.emoji} tournaments.`})
        if (!tournaments.length && !format) return interaction.reply({ content: `There are no active tournaments.`})
        
        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return

        const timestamp = Date.now()
        let hours = interaction.options.getNumber('hours')
        let minutes = interaction.options.getNumber('minutes')
        const timeRemaining = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000)
        const deadline = new Date(timestamp + timeRemaining)
        await tournament.update({ deadline })

        while (minutes >= 60) {
            hours++
            minutes-= 60
        }

        const word1 = hours === 1 ? 'hour' : 'hours'
        const word2 = minutes === 1 ? 'minute' : 'minutes'

        if (hours < 1) {
            interaction.reply(`${emojis.high_alert} **Attention: ${tournament.name} Participants!** ${emojis.high_alert} The next round begins now! You have ${minutes} ${word2} to complete your match. ${emojis.thinkygo}`)
        } else {
            interaction.reply(`${emojis.high_alert} **Attention: ${tournament.name} Participants!** ${emojis.high_alert} The next round begins now! You have ${hours} ${word1} and ${minutes} ${word2} to complete your match. ${emojis.thinkygo}`)
        }

        sendPairings(interaction.guild, server, tournament, true)
        return setTimeout(() => {
            return interaction.channel.send(`${emojis.high_alert} **Attention: ${tournament.name} Participants!** ${emojis.high_alert} Time is up in the round! ${emojis.vince}`)
        }, timeRemaining)
    }
}