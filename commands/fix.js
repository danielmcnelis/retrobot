


const { SlashCommandBuilder } = require('discord.js')
const { isProgrammer } = require('../functions/utility')
const { Deck, Player, Tournament } = require('../../formatlibrary/libs/models/src/lib/index.js')
const { Op } = require('sequelize')
const { selectTournament } = require('../functions/tournament')
const { checkExpiryDate, uploadDeckFolder } = require('../functions/drive')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fix')
        .setDescription('Fix an issue. 🛠️'),
    async execute(interaction) {
        if (isProgrammer(interaction.member)) {
            const tournaments = await Tournament.findAll({
                where: {
                    serverId: interaction.guildId,
                    createdAt: { [Op.gte]: "2022-12-01 00:00:00.000+00" },
                },
                order: [["createdAt", "ASC"]],
            })

            const tournament = await selectTournament(interaction, tournaments)
            if (!tournament) return

            const decks = await Deck.findAll({
                where: {
                    eventName: {
                        [Op.or]: [tournament.abbreviation, tournament.name]
                    }
                },
                include: Player
            })

            try {
                await checkExpiryDate(server)
                await uploadDeckFolder(server, tournament.name, decks)
                return interaction.reply({ content: `Your tournament files have been uploaded! ${server.logo}` })
            } catch (err) {
                console.log(err)
                return interaction.reply({ content: `Error. Check bot logs.` })
            }
        } else {
            return interaction.reply('🛠️')
        }
    }
}