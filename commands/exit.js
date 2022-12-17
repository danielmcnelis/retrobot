


const { SlashCommandBuilder } = require('discord.js')
const { Player, RatedPool } = require('../db')
const { getDropFormats } = require('../functions/rated')

const getExitInformation = async (interaction, player) => {
    const oldRatedPools = await RatedPool.findAll({ where: {  playerId: player.id } }) || []
    if (!oldRatedPools.length) return interaction.user.send(`You are not in any Rated Pools.`)

    const pools = oldRatedPools.map((p) => p.format)

    const drops = await getDropFormats(interaction, pools)
    if (!drops || !drops.length) return interaction.user.send(`Please specify a valid number.`)

    const results = []
    for (let i = 0; i < drops.length; i++) {
        try {
            const format = drops[i]
            const oldRatedPool = await RatedPool.findOne({ where: { format: format, playerId: player.id } })
            await oldRatedPool.destroy()
            results.push(format)
        } catch (err) {
            console.log(err)
        }
    }

    return interaction.user.send({ content: `You left the Rated Pool for the following format(s):\n${results.join('\n').toString()}.`}).catch((err) => console.log(err))
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('exit')
        .setDescription('Exit the rated pool. 👋'),
    async execute(interaction) {
        if (interaction.guildId) return interaction.reply(`Try using **/exit** by DM'ing it to me.`)
        const player = await Player.findOne({ where: { discordId: interaction.user.id } })
        if (!player) return interaction.reply(`You are not in the database. Please join the Format Library Discord server to register.`)
        interaction.reply('🤔')
        return getExitInformation(interaction, player)
    }
}