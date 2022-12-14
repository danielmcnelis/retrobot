
const { SlashCommandBuilder } = require('discord.js')
const { updateServers } = require('../functions/chron')
const { isProgrammer } = require('../functions/utility')
const { client } = require('../static/clients.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Performs a test.'),
    async execute(interaction) {
        if (isProgrammer(interaction.member)) {
            updateServers(client)
            await interaction.reply(emojis.yellow)
        } else {
            await interaction.reply('🧪')
        }
    }
}