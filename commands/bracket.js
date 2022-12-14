

const { SlashCommandBuilder } = require('discord.js')
const { Format, Server, Tournament } = require('../db')
const emojis = require('../static/emojis.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bracket')
        .setDescription('Post brackets for active tournaments.'),
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
                state: { [Op.not]: 'complete'},
                formatName: format ? format.name : {[Op.not]: null},
                serverId: interaction.guildId
            },
            order: [['createdAt', 'ASC']]
        })

        if (!tournaments.length && format) return interaction.reply({ content: `There are no active ${format.name} ${server.emoji || format.emoji} tournaments.`})
        if (!tournaments.length && !format) return interaction.reply({ content: `There are no active tournaments.`})
        
        const results = []
        for (let i = 0; i < tournaments.length; i++) {
            const tournament = tournaments[i]
            results.push(`Name: ${tournament.name} ${tournament.logo}` +
                `\nFormat: ${tournament.formatName} ${tournament.emoji}` + 
                `\nBracket: <https://challonge.com/${tournament.url}>` +
                `\nType: ${capitalize(tournament.type, true)}` +
                `\nStatus: ${capitalize(tournament.state, true)}`
            )
        }

        return interaction.reply({ content: results.join('\n\n').toString() })
    }
}