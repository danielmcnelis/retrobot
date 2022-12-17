


const { SlashCommandBuilder } = require('discord.js')
const { Format, Server, Tournament } = require('../db')
const emojis = require('../static/emojis.json')
const { hasPartnerAccess } = require('../functions/utility')
const { Op } = require('sequelize')
const { selectTournament } = require('../functions/tournament')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timer')
        .setDescription('Post time remaining in the round. ⏰'),
    async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
        
        if (!hasPartnerAccess(server)) return interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        
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

        const now = new Date()
        const difference = tournament.deadline - now

        if (difference < 0) return interaction.reply(`The deadline has passed.`)
        if (difference < 60 * 1000) return interaction.reply(`Remaining time: less than 1 minute.`)

        let hours = Math.floor(difference / (1000 * 60 * 60))
        const word1 = hours === 1 ? 'hour' : 'hours'
        let minutes = Math.round((difference - (hours * (1000 * 60 * 60))) / (1000 * 60))
        
        while (minutes >= 60) {
            hours++
            minutes-= 60
        }

        if (hours < 1) {
            const word2 = minutes === 1 ? 'minute' : 'minutes'
            return interaction.reply(`Remaining time: ${minutes} ${word2}.`)
        } else {
            const word2 = minutes === 1 ? 'minute' : 'minutes'
            return interaction.reply(`Remaining time: ${hours} ${word1} and ${minutes} ${word2}.`)
        }
    }
}