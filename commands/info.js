
const { SlashCommandBuilder } = require('discord.js')
const { Format, Server } = require('../db')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Post format overview.'),
    async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
        
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: mcid
                }
            }
        })

        return interaction.reply(`**${format.name.toUpperCase()} FORMAT ${format.emoji} - OVERVIEW**\nhttps://formatlibrary.com/formats/${urlize(format.name)}`)
    }
}