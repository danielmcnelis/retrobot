
const { SlashCommandBuilder } = require('discord.js')
const { updateServers } = require('../functions/chron')
const { isProgrammer } = require('../functions/utility')
const { client } = require('../static/clients.js')
const emojis = require('../static/emojis.json')
const { Format } = require('../db')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Performs a test. 🧪'),
    async execute(interaction) {
        if (isProgrammer(interaction.member)) {
            console.log('interaction.guild.roles.cache', interaction.guild.roles.cache)
            await interaction.reply(emojis.yellow)
        } else {
            await interaction.reply('🧪')
        }
    }
}