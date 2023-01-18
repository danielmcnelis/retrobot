


const { SlashCommandBuilder } = require('discord.js')
const { Format, Match, Player, Server, Stats } = require('.././db/index.js')
const QuickChart = require('quickchart-js')
const { capitalize, hasAffiliateAccess } = require('../functions/utility')
const { Op } = require('sequelize')
const emojis = require('../static/emojis.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription(`View a player's Elo history chart. 📈`)
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('The player you want to check.')
                .setRequired(false)
        ),
    async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
        
        if (!hasAffiliateAccess(server)) return interaction.reply({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })

        if (!format) return interaction.reply({ content: `Try using **/history** in channels like: <#414575168174948372> or <#629464112749084673>.`})  

        let x = 250
        if (x > 2500) return interaction.reply({ content: "Please provide a number less than or equal to 2500."})
        
        const user = interaction.options.getUser('player') || interaction.user    
        const discordId = user.id
        const player = await Player.findOne({ where: { discordId: discordId } })
        if (!player) return interaction.reply({ content: "That user is not in the database."})
        let eloHistory = [500]
        const serverId = server.internalLadder ? server.id : '414551319031054346'

        const matches = await Match.findAll({
            where: {
                format: format.name,
                [Op.or]: [
                    { winnerId: player.id }, 
                    { loserId: player.id }
                ],
                serverId: serverId
            },
            order: [['createdAt', 'ASC']]
        })

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i]
            const delta = match.delta
            const sign = match.winnerId === player.id ? 1 : -1
            const prevElo = eloHistory.slice(-1)[0] 
            const nextElo = prevElo + (sign * delta)
            eloHistory.push(nextElo)
        }

        if (eloHistory.length < x) x = eloHistory.length

        if (x <= 250) {
            const data = eloHistory.slice(-x)
            const suggestedMin = Math.round(Math.min(...data) / 25) * 25 - 25
            const suggestedMax = Math.round(Math.max(...data) / 25) * 25 + 25
            const matchNumbers = Array.from({length: x}, (_, k) => x - k)
            const radius = x <= 10 ? 3 : x <= 50 ? 2 : 1
            const chart = new QuickChart()
            chart.setConfig({
                type: 'line',
                data: {
                    labels: matchNumbers,
                    datasets: [
                        {
                            label: 'Elo',
                            backgroundColor: 'rgb(10, 54, 138)',
                            borderColor: 'rgb(10, 54, 138)',
                            data: data,
                            pointRadius: radius,
                            fill: false,
                        },
                        {
                            label: '500',
                            backgroundColor: 'rgb(186, 186, 186)',
                            borderColor: 'rgb(186, 186, 186)',
                            data: new Array(x).fill(500),
                            pointRadius: 0,
                            fill: false,
                        },
                    ],
                },
                options: {
                    title: {
                        display: true,
                        text: `${player.name}'s ${format.name} Elo History - Last ${x} Matches`,
                    },
                    legend: {
                        display: false
                    },
                    xAxes: [{
                        display: false,
                        gridLines: {
                            display: true,
                        },
                    }],
                    scales: {
                        yAxes: [
                            {
                                ticks: {
                                    suggestedMin: suggestedMin,
                                    suggestedMax: suggestedMax,
                                }
                            }
                        ]
                    },
                },
            })
    
            const url = await chart.getShortUrl()
            interaction.reply({ content: `${url}` })
        } else {
            for (let i = 0; i < x; i += 250) {
                let xAxisLength = x - i >= 250 ? 250 : x - i
                const data = eloHistory.slice(i, i + 250)
                const suggestedMin = Math.round(Math.min(...eloHistory) / 25) * 25 - 25
                const suggestedMax = Math.round(Math.max(...eloHistory) / 25) * 25 + 25
                const matchNumbers = Array.from({length: xAxisLength}, (_, k) => i + k)
                const radius = xAxisLength <= 10 ? 3 : xAxisLength <= 50 ? 2 : 1
                const chart = new QuickChart()
                chart.setConfig({
                    type: 'line',
                    data: {
                        labels: matchNumbers,
                        datasets: [
                            {
                                label: 'Elo',
                                backgroundColor: 'rgb(10, 54, 138)',
                                borderColor: 'rgb(10, 54, 138)',
                                data: data,
                                pointRadius: radius,
                                fill: false,
                            },
                            {
                                label: '500',
                                backgroundColor: 'rgb(186, 186, 186)',
                                borderColor: 'rgb(186, 186, 186)',
                                data: new Array(xAxisLength).fill(500),
                                pointRadius: 0,
                                fill: false,
                            },
                        ],
                    },
                    options: {
                        title: {
                            display: true,
                            text: `${player.name}'s ${server.internalLadder ? 'Internal ' : ''}${capitalize(format, true)} Elo History - Matches ${i} - ${i + xAxisLength}`,
                        },
                        legend: {
                            display: false
                        },
                        xAxes: [{
                            display: false,
                            gridLines: {
                                display: true,
                            },
                        }],
                        scales: {
                            yAxes: [
                                {
                                    ticks: {
                                        suggestedMin: suggestedMin,
                                        suggestedMax: suggestedMax,
                                    }
                                }
                            ]
                        },
                    },
                })
                
                const url = await chart.getShortUrl()
                const channel = interaction.guild.channels.cache.get(server.botSpamChannel)
                if (!channel) {
                    return interaction.reply({ content: `Error: could not find bot-spam channel.`})
                } else if (i === 0) {
                    interaction.reply({ content: `The chart(s) you requested will appear in <#${botSpamChannel}>.`})
                }

                channel.send({ content: `${url}` })
            }
        }
    }
}
