


const { SlashCommandBuilder } = require('discord.js')
const { Format, Server } = require('../db')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription('Search for a card.')
		.addStringOption(str =>
            str
                .setName('string')
                .setDescription('Enter search query.')
                .setRequired(true)
        ),
	async execute(interaction) {
        const query = interaction.options.getString('string')
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

        const { cardEmbed, attachment } = await search(query, fuzzyCards, format)
        if (!cardEmbed) {
            interaction.reply({ content: `Could not find: "${query}".`})
        } else if (attachment) {
            interaction.reply({ embeds: [cardEmbed], files: [attachment] })
        } else {
            return interaction.reply({ embeds: [cardEmbed] })
        }
	}
}