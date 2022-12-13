
const { SlashCommandBuilder } = require('@discordjs/builders')
console.log('SlashCommandBuilder', SlashCommandBuilder)

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with 🏓!'),
	async execute(interaction) {
		await interaction.reply('🏓')
	}
}