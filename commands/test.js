
const { SlashCommandBuilder } = require('discord.js')
const { isProgrammer } = require('../functions/utility')
const { updateDeckTypes } = require('../functions/chron')
const emojis = require('../static/emojis.json')
const { client } = require('../static/clients.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Performs a test. 🧪'),
    async execute(interaction) {
        if (isProgrammer(interaction.member)) {
            updateDeckTypes(client)
            await interaction.reply(emojis.yellow)
        } else {
            await interaction.reply('🧪')
        }
    }
}