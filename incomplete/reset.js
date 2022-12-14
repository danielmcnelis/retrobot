
    // RESET
    if (cmd === `!reset`) {
        if (!hasFullAccess(server)) return message.channel.send({ content: `This feature is only available in Format Library. ${emojis.FL}`})
        if (!isMod(server, message.member)) return message.channel.send({ content: "You do not have permission to do that."})
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: mcid
                }
            }
        })
        
        if (!format) return message.channel.send({ content: `Try using **${cmd}** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        return resetIron(message.channel, format)
    }