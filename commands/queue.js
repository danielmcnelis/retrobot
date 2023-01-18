

const { SlashCommandBuilder } = require('discord.js')
const { Format, Iron, Server } = require('../../formatlibrary/libs/models/src/lib/index.js')
const { hasFullAccess } = require('../functions/utility')
const { Op } = require('sequelize')

const emojis = require('../static/emojis.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Post the iron queue. 🇬🇧'),
    async execute(interaction) {
        const server = !interaction.guildId ? {} : 
        await Server.findOne({ where: { id: interaction.guildId }}) || 
        await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        if (!hasFullAccess(server)) return interaction.reply({ content: `This feature is only available in Format Library. ${emojis.FL}`})
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })
        
        if (!format) return interaction.reply({ content: `Try using **/queue** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        const queue = [...await Iron.findAll({ where: { format: format.name }})].map((i) => i.name)
        if (!queue.length) return interaction.reply({ content: `The ${format.name} ${server.emoji || format.emoji} Iron queue is empty. ${emojis.iron}`})
        return interaction.reply({ content: `${format.name} ${server.emoji || format.emoji} Iron Queue:\n` + queue.join('\n').toString() })
    }
}
