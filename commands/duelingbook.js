
const { SlashCommandBuilder } = require('discord.js')
const { Player } = require('../db')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('duelingbook')
		.setDescription('Set your DuelingBook name. 📛')
		.addStringOption(str =>
            str
                .setName('string')
                .setDescription('Your DuelingBook name.')
                .setRequired(true)
        ),
	async execute(interaction) {
        const duelingBook = interaction.options.getString('string')
        const player =  await Player.findOne({ where: { discordId: interaction.user.id } })
        await player.update({ duelingBook })
        return interaction.reply({ content: `Your DuelingBook username has been set to: ${player.duelingBook}.`})
	}
}
