
const { SlashCommandBuilder } = require('discord.js')
const { Format, Server } = require('.././db/index.js')
const { urlize } = require('../functions/utility')
const { Op } = require('sequelize')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Post format overview. 📚'),
    async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
        
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })

        if (!format) return interaction.reply({ content: `Try using /info in channels like: <#414575168174948372> or <#629464112749084673>.`})
        return interaction.reply(`**${format.name.toUpperCase()} FORMAT ${format.emoji} - OVERVIEW**\nhttps://formatlibrary.com/formats/${urlize(format.name)}`)
    }
}