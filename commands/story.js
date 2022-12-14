
const { SlashCommandBuilder } = require('discord.js')
const { hasFullAccess, isMod } = require('../functions/utility')
const { postStory } = require('../functions/iron')
const emojis = require('../static/commands.json')
const { Format, Server } = require('../db')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('story')
		.setDescription('Posts the Iron Story.'),
	async execute(interaction) {
        const server = !mgid ? {} : 
            await Server.findOne({ where: { id: interaction.guild.id }}) || 
            await Server.create({ id: interaction.guild.id, name: interaction.guild.name })

        if (!hasFullAccess(server)) return interaction.replay({ content: `This feature is only available in Format Library. ${emojis.FL}`})
        if (!isMod(server, interaction.member)) return interaction.replay({ content: `You do not have permission to do that.`})

        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: mcid
                }
            }
        })

        return postStory(interaction, format)
	}
}