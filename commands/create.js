



const { ActionRowBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const { SlashCommandBuilder } = require('discord.js')
const { Format, Server } = require('../db')
const emojis = require('../static/emojis.json')
const { isMod, hasPartnerAccess } = require('../functions/utility')
const { sendPairings, selectTournament } = require('../functions/tournament')
const { Op } = require('sequelize')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create')
        .setDescription('Create a tournament.')
        .addChannelOption(cha =>
            cha
                .setName('channel')
                .setDescription('Enter tournament name.')
                .setRequired(true)
        ),
    async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
        
        if (!hasPartnerAccess(server)) return interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, interaction.member)) return interaction.reply({ content: 'You do not have permission to do that.'})

        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })

		const modal = new ModalBuilder()
            .setCustomId('createTournament')
            .setTitle('Create a New Tournament')

        const name = new TextInputBuilder()
            .setCustomId('name')
            .setLabel("Full name of the tournament?")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)

        const abbreviation = new TextInputBuilder()
            .setCustomId('abbreviation')
            .setLabel("Abbreviation for the tournament?")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            
        const tournament_type = new TextInputBuilder()
            .setCustomId('tournament_type')
            .setLabel("Type of tournament (SE, DE, SW, RR)?")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)

        const nameRow = new ActionRowBuilder().addComponents(name)
        const abbreviationRow = new ActionRowBuilder().addComponents(abbreviation)
        const typeRow = new ActionRowBuilder().addComponents(tournament_type)

        // Add inputs to the modal
        modal.addComponents(nameRow, abbreviationRow, typeRow)

        if (!format) {
            const formatName = new TextInputBuilder()
                .setCustomId('formatName')
                .setLabel("What format will be played?")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)

            const formatRow = new ActionRowBuilder().addComponents(formatName)
            modal.addComponents(formatRow)
        } else {
            interaction.formatName = format.name
        }

        console.log('modal', modal)
        return await interaction.showModal(modal)        
    }
}
