

const { SlashCommandBuilder } = require('discord.js')
const { Player, Pool } = require('../db')
const emojis = require('../static/emojis.json')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pools')
		.setDescription('Check your Rated Pools. 🏊'),
	async execute(interaction) {
        if (interaction.guildId) {
            interaction.reply(`Please check your DMs.`)
        } else {
            interaction.reply(`🤿`)
        }

        const player = await Player.findOne({ where: { discordId: interaction.user.id } })
        if (!player) return interaction.user.send(`You are not in the database. Please join the Format Library ${emojis.FL} Discord server to register.`)
        const pools = [...await Pool.findAll({ where: { playerId: player.id }, order: [['format', 'ASC']] })].map((p) => p.format)
        if (!pools.length) return interaction.user.send(`You are not in any Rated Pools.`)
        return interaction.user.send({ content: `You are in the following pools:\n${pools.join('\n')}`})
	}
}