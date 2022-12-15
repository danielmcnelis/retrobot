


const { SlashCommandBuilder } = require('discord.js')
const { Entry, Format, Player, Server, Tournament } = require('../db')
const { Op } = require('sequelize')
const { selectTournamentForDeckCheck } = require('../functions/tournament')
const { drawDeck, isMod } = require('../functions/utility')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deck')
        .setDescription(`Check tournament player's deck.`)
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('The tournament player to check.')
                .setRequired(false)
        ),
    async execute(interaction) {
        const user = interaction.options.getUser('player')
        
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
        
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })
        
        const tournaments = await Tournament.findAll({
            where: { 
                state: {[Op.or]: ["pending", "underway"]}, 
                formatName: format.name,
                serverId: interaction.guildId 
            },
            order: [["createdAt", "ASC"]]
        })

        const discordId = user.id
        const isAuthor = discordId === interaction.user.id
        if (!isMod(server, interaction.member) && !isAuthor) return interaction.reply({ content: `You do not have permission to do that.` })

        const player = await Player.findOne({ where: { discordId: discordId } })
        if (!player) return interaction.reply({ content: `${isAuthor ? "You are" : "That player is"} not in the database.`})

        const entries = []

        for (let i = 0; i < tournaments.length; i++) {
            try {
                const tournament = tournaments[i]
                const entry = await Entry.findOne({
                    where: {
                        playerId: player.id,
                        tournamentId: tournament.id
                    },
                    include: Tournament
                })

                if (entry) entries.push(entry)
            } catch (err) {
                console.log(err)
            }
        }
        
        const entry = await selectTournamentForDeckCheck(interaction, entries, isAuthor, format)
        if (!entry) return

        interaction.reply({ content: `Please check your DMs.` })
        const deckAttachments = await drawDeck(entry.ydk) || []
        return interaction.member.send({ content: `${isAuthor ? `${player.name}\'s` : 'Your'} deck for ${tournament.name} is:\n<${entry.url}>`, files: [...deckAttachments]}).catch((err) => console.log(err))
    }
}
