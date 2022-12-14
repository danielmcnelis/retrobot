
    const { SlashCommandBuilder } = require('discord.js')

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('seed')
            .setDescription('Replies with 🌱!'),
        async execute(interaction) {
            await interaction.reply('🌱')
        }
    }