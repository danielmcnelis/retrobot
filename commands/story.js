
const { SlashCommandBuilder } = require('discord.js')
const { hasFullAccess, isMod } = require('../functions/utility')
const { postStory } = require('../functions/iron')
const emojis = require('../static/emojis.json')
const { Format, Server } = require('../../formatlibrary/libs/models/src/lib/index.js')
const { Op } = require('sequelize')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('story')
		.setDescription('Posts the Iron Story. 📖'),
	async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        if (!hasFullAccess(server)) return interaction.reply({ content: `This feature is only available in Format Library. ${emojis.FL}`})
        if (!isMod(server, interaction.member)) return interaction.reply({ content: `You do not have permission to do that.`})

        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })

        return postStory(interaction, format)
	}
}