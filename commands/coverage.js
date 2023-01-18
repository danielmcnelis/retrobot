

const { SlashCommandBuilder } = require('discord.js')
const { Event, Format, Player, Server } = require('../../formatlibrary/libs/models/src/lib/index.js')
const { hasFullAccess, isMod } = require('../functions/utility')
const { Op } = require('sequelize')
const { composeBlogPost, composeThumbnails, displayDecks } = require('../functions/coverage')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coverage')
        .setDescription('Post tournament coverage. 🖊️')
		.addStringOption(str =>
            str
                .setName('tournament')
                .setDescription('Enter tournament name.')
                .setRequired(true)
        ),
    async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        if (!hasFullAccess(server)) return interaction.reply(`This feature is only available in Format Library. ${emojis.FL}`) 
        if (!isMod(server, interaction.member)) return interaction.reply(`You do not have permission to do that.`)
        
        const input = interaction.options.getString('tournament')     
        const event = await Event.findOne({ 
            where: { 
                [Op.or]: {
                    name: input,
                    abbreviation: input
                }
            },
            include: [Format, Player]
        })

        if (!event) return interaction.reply(`No event found.`)
        if (event.display === false) await event.update({ display: true })

        interaction.reply(`Generating coverage for ${event.name}. Please wait.`)
        await displayDecks(interaction, event)
        await composeThumbnails(interaction, event)
        await composeBlogPost(interaction, event)
        return
    }
}