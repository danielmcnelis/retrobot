

const { SlashCommandBuilder } = require('discord.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dice')
		.setDescription('Roll a 6-sided die! 🎲'),
	async execute(interaction) {
        const result = Math.floor((Math.random() * 6) + 1)
        return interaction.reply({ content: `You rolled a **${result}** with a 6-sided die.`})
	}
}