



const { ActionRowBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const { SlashCommandBuilder } = require('discord.js')
const { Format, Server, Tournament } = require('../db')
const emojis = require('../static/emojis.json')
const { isMod, hasPartnerAccess } = require('../functions/utility')
const { sendPairings, selectTournament } = require('../functions/tournament')
const { Op } = require('sequelize')
const { client } = require('../static/clients.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create')
        .setDescription('Create a tournament.'),
    async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
        
        if (!hasPartnerAccess(server)) return interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, interaction.member)) return interaction.reply({ content: 'You do not have permission to do that.'})

		// Create the modal
		const modal = new ModalBuilder()
        .setCustomId('myModal')
        .setTitle('My Modal')

        // Add components to modal

        // Create the text input components
        const tourNameInput = new TextInputBuilder()
            .setCustomId('tourNameInput')
            // The label is the prompt the user sees for this input
            .setLabel("Full name of the tournament?")
            // Short means only a single line of text
            .setStyle(TextInputStyle.Short)


        // Create the text input components
        const tourAbbreviationInput = new TextInputBuilder()
            .setCustomId('tourAbbreviationInput')
            // The label is the prompt the user sees for this input
            .setLabel("Abbreviation of the tournament?")
            // Short means only a single line of text
            .setStyle(TextInputStyle.Short)
            
        const tourTypeInput = new TextInputBuilder()
            .setCustomId('tourTypeInput')
            .setLabel("What type of tournament?")
            // Paragraph means multiple lines of text.
            .setStyle(TextInputStyle.Short)

        const tourFormatInput = new TextInputBuilder()
            .setCustomId('tourFormatInput')
            .setLabel("What format will be played?")
            // Paragraph means multiple lines of text.
            .setStyle(TextInputStyle.Short)

        const nameRow = new ActionRowBuilder().addComponents(tourNameInput)
        const abbreviationRow = new ActionRowBuilder().addComponents(tourAbbreviationInput)
        const tourTypeRow = new ActionRowBuilder().addComponents(tourTypeInput)
        const tourFormatRow = new ActionRowBuilder().addComponents(tourFormatInput)

        // Add inputs to the modal
        modal.addComponents(nameRow, abbreviationRow, tourTypeRow, tourFormatRow)

        // Show the modal to the user
        await interaction.showModal(modal)

        return
        
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })

        const tournament_type = await getTournamentType(message)
        if (!tournament_type) return interaction.reply({ content: `Please select a valid tournament type.`})
        const channelId = await getTournamentChannel(server, format, message)
        if (!interaction.guild.channels.cache.get(channelId)) return interaction.reply({ content: `Please specify a valid tournament channel.`})

        const str = generateRandomString(10, '0123456789abcdefghijklmnopqrstuvwxyz')

        const input = args[0].replace(/[^\ws]/gi, "_").replace(/ /g,'')

        const name = input.startsWith('FLC') ? `Format Library Championship ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('YRS') ? `Yu-Gi-Oh! Retro Series ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('DLC') ? `Drama Llama Classic ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('DDS') ? `Digbic Dig Series ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('ETC') ? `Ellietincan Cup ${pparseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('ACS') ? `Format Library Championship ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('KGP') ? `Format Library Championship ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('DCT') ? `Duelist Crown Tournament ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('DSC') ? `Dark Side Cup ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('WWC') ? `Woawa World Cup ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('GASP') ? `Gigachad Advanced Sneak Preview ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('RWL') ? `Retro World Locals ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('BC') ? `Blazing Cheaters ${parseInt(input.replace(/[^0-9]/g,''))}` : 
            input.startsWith('FWL') ? `Future World Locals ${parseInt(input.replace(/[^0-9]/g,''))}` : 
            input

        const logo = input.startsWith('FLC') ? emojis.FL :
            input.startsWith('YRS') ? emojis.mlady :
            input.startsWith('DLC') ? emojis.lmfao :
            input.startsWith('DDS') ? emojis.stoned :
            input.startsWith('ETC') ? emojis.lipton :
            input.startsWith('ACS') ? emojis.toad :
            input.startsWith('KGP') ? emojis.UredU :
            input.startsWith('DCT') ? emojis.king :
            input.startsWith('DSC') ? emojis.evil :
            input.startsWith('WWC') ? '🦉 ⚽' :
            input.startsWith('GASP') ? emojis.gigachad :
            input.startsWith('RWL') ? emojis.celtic :
            input.startsWith('FWL') ? emojis.farqred :
            input.startsWith('BC') ? emojis.speeder :
            server.logo || emojis.legend

        try {
            const { status, data } = await axios({
                method: 'post',
                url: `https://api.challonge.com/v1/tournaments.json?api_key=${server.challongeAPIKey}`,
                data: {
                    tournament: {
                        name: name,
                        url: input,
                        tournament_type: tournament_type,
                        game_name: 'Yu-Gi-Oh!',
                        pts_for_match_tie: "0.0"
                    }
                }
            })
            
            if (status === 200 && data) {
                await Tournament.create({ 
                    id: data.tournament.id,
                    name: name,
                    abbreviation: input,
                    state: 'pending',
                    type: tournament_type,
                    formatName: format.name,
                    logo: logo,
                    emoji: server.emoji || format.emoji,
                    url: data.tournament.url,
                    channelId: channelId,
                    serverId: interaction.guildId,
                    community: server.name
                })

                return interaction.reply({ content: 
                    `You created a new tournament:` + 
                    `\nName: ${name} ${logo}` + 
                    `\nFormat: ${format.name} ${server.emoji || format.emoji}` + 
                    `\nType: ${capitalize(data.tournament.tournament_type, true)}` +
                    `\nBracket: https://challonge.com/${data.tournament.url}`
                })
            } 
        } catch (err) {
            console.log(err)
            try {
                const { status, data } = await axios({
                    method: 'post',
                    url: `https://api.challonge.com/v1/tournaments.json?api_key=${server.challongeAPIKey}`,
                    data: {
                        tournament: {
                            name: name,
                            url: str,
                            tournament_type: tournament_type,
                            game_name: 'Yu-Gi-Oh!',
                            pts_for_match_tie: "0.0"
                        }
                    }
                })
                
                if (status === 200 && data) {
                    await Tournament.create({ 
                        id: data.tournament.id,
                        name: data.tournament.name,
                        state: data.tournament.state,
                        type: data.tournament.tournament_type,
                        formatName: format.name,
                        logo: logo,
                        emoji: server.emoji || format.emoji,
                        url: data.tournament.url,
                        channelId: channelId,
                        serverId: interaction.guildId,
                        community: server.name
                    })

                    return interaction.reply({ content: 
                        `You created a new tournament:` + 
                        `\nName: ${data.tournament.name} ${logo}` + 
                        `\nFormat: ${format.name} ${server.emoji || format.emoji}` + 
                        `\nType: ${capitalize(data.tournament.tournament_type, true)}` +
                        `\nBracket: https://challonge.com/${data.tournament.url}`
                    })
                } 
            } catch (err) {
                console.log(err)
                return interaction.reply({ content: `Unable to connect to Challonge account.`})
            }
        }
        
        
    }
}
