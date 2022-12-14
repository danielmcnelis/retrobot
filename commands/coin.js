

const { SlashCommandBuilder } = require('discord.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('coin')
		.setDescription('Flip a coin! 🪙'),
	async execute(interaction) {
        const coin = Math.floor((Math.random() * 2)) === 0 ? 'Heads' : 'Tails'
        return interaction.reply({ content: `Your coin landed on: **${coin}**!`})
	}
}