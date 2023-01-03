


const { SlashCommandBuilder } = require('discord.js')
const { Entry, Format, Server, Tournament } = require('../db')
const emojis = require('../static/emojis.json')
const { hasPartnerAccess } = require('../functions/utility')
const { Op } = require('sequelize')
const { getMatches, getParticipants, selectTournament } = require('../functions/tournament')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('standings')
        .setDescription('Post Swiss tournament standings. ⏰'),
    async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
        
        if (!hasPartnerAccess(server)) return interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        
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
                state: 'underway',
                type: 'swiss',
                formatName: format ? format.name : {[Op.not]: null},
                serverId: interaction.guildId
            },
            order: [['createdAt', 'ASC']]
        })

        if (!tournaments.length && format) return interaction.reply({ content: `There are no active ${format.name} ${server.emoji || format.emoji} Swiss tournaments.`})
        if (!tournaments.length && !format) return interaction.reply({ content: `There are no active Swiss tournaments.`})
        
        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return

        interaction.reply(`Calculating standings, please wait.`)

        const matches = await getMatches(server, tournament.id)
        const participants = await getParticipants(server, tournament.id)

        const data = {}

        let currentRound = 1

        for (let i = 0; i < participants.length; i++) {
            const p = participants[i]

            const entry = await Entry.findOne({
                where: {
                    participantId: p.participant.id
                }
            })

            if (!entry) {
                console.log(`no entry:`, p.participant)
                continue
            }

            data[p.participant.id] = {
                name: entry.playerName,
                rank: '',
                wins: 0,
                losses: 0,
                ties: 0,
                byes: 0,
                score: 0,
                active: entry.active,
                roundDropped: entry.roundDropped,
                roundsWithoutBye: [],
                opponents: [],
                opponentScores: [],
                defeated: [],
                winsVsTied: 0,
                rawBuchholz: 0,
                medianBuchholz: 0
            }
        }

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i].match
            const round = parseInt(match.round)

            if (match.state === 'pending') {
                continue
            } else if (match.state === 'open') {
                if (round > currentRound) currentRound = round
                data[match.player1_id].roundsWithoutBye.push(round)
                data[match.player2_id].roundsWithoutBye.push(round)
            } else if (match.state === 'complete' && match.winner_id && match.loser_id) {
                if (round > currentRound) currentRound = match.round
                data[match.winner_id].wins++
                data[match.winner_id].defeated.push(match.loser_id)
                data[match.winner_id].opponents.push(match.loser_id)
                data[match.winner_id].roundsWithoutBye.push(round)
                data[match.loser_id].losses++
                data[match.loser_id].opponents.push(match.winner_id)
                data[match.loser_id].roundsWithoutBye.push(round)
            } else if (match.state === 'complete') {
                if (round > currentRound) currentRound = round
                data[match.player1_id].ties++
                data[match.player1_id].opponents.push(match.player2_id)
                data[match.player1_id].roundsWithoutBye.push(round)
                data[match.player2_id].ties++
                data[match.player2_id].opponents.push(match.player1_id)
                data[match.player2_id].roundsWithoutBye.push(round)
            }
        }

        const rounds = []
        let i = 1
        while (i <= currentRound) {
            rounds.push(i)
            i++
        }
        
        const keys = Object.keys(data)

        keys.forEach((k) => {
            for (let j = 1; j <= currentRound; j++) {
                if (!data[k].roundsWithoutBye.includes(j) && (data[k].active || data[k].roundDropped > j)) {
                    console.log(`round ${j} BYE found for ${data[k].name}`)
                    data[k].byes++
                }
            }
        })

        keys.forEach((k) => {
            data[k].score = data[k].wins + data[k].byes
        })

        keys.forEach((k) => {
            for (let i = 0; i < data[k].opponents.length; i++) {
                const opponentId = data[k].opponents[i]
                data[k].opponentScores.push(data[opponentId].score)
                if (data[opponentId].score === k.score) k.winsVsTied++
            }

            const arr = data[k].opponentScores.sort()
            arr.shift()
            arr.pop()
            data[k].rawBuchholz = data[k].opponentScores.reduce((accum, val) => accum + val, 0)
            data[k].medianBuchholz = arr.reduce((accum, val) => accum + val, 0)
        })

        const standings = Object.values(data).sort((a, b) => {
            if (a.score > b.score) {
                return -1
            } else if (a.score < b.score) {
                return 1
            } else if (a.medianBuchholz > b.medianBuchholz) {
                return -1
            } else if (a.medianBuchholz < b.medianBuchholz) {
                return 1
            } else if (a.winsVsTied > b.winsVsTied) {
                return -1
            } else if (a.winsVsTied < b.winsVsTied) {
                return 1
            } else {
                return 0
            }
        })

        const results = [ `${tournament.logo} - ${tournament.name} Standings - ${tournament.emoji}` , `**Rank.  Name  (W-L-T)  [Score / Med-Buch / WvT]**`]

        for (let index = 0; index < standings.length; index++) {
            const s = standings[index]
            if (
                (
                    // if at the end or has a better score/tie-breakers than the next player
                    index + 1 === standings.length || (
                        s.score > standings[index + 1].score || 
                        s.score === standings[index + 1].score && s.medianBuchholz > standings[index + 1].medianBuchholz || 
                        s.score === standings[index + 1].score && s.medianBuchholz === standings[index + 1].medianBuchholz && s.winsVsTied > standings[index + 1].winsVsTied
                    )
                ) && (
                    // and at the beginning or not tied with the previous player
                    index === 0 || (
                        s.score !== standings[index - 1].score ||
                        s.medianBuchholz !== standings[index - 1].medianBuchholz || 
                        s.winsVsTied !== standings[index - 1].winsVsTied
                    )
                )
            ) {
                // then assign a unique ranking for this index position
                if (index >= participants.length / 3) break
                s.rank = `${index + 1}`
            } else if (index === 0) {
                // else if at the beginning then assign T1 ranking
                s.rank = 'T1'
            } else if (
                // else if tied with previous player
                s.score === standings[index - 1].score && 
                s.medianBuchholz === standings[index - 1].medianBuchholz && 
                s.winsVsTied === standings[index - 1].winsVsTied
            ) {
                // then assign the same ranking as the previous player
                s.rank = standings[index - 1].rank
            } else {
                // assign a new tied ranking for this index position
                if (index >= participants.length / 3) break
                s.rank = `T${index + 1}`
            }

            results.push(`${s.rank}.  ${s.name}  (${s.wins}-${s.losses}-${s.ties})${s.byes ? ` +BYE` : ''}  [${Math.round(s.score * 10) / 10} / ${Math.round(s.medianBuchholz * 10) / 10} / ${s.winsVsTied}]`)
        }

        return interaction.channel.send(results.join('\n'))
    }
}