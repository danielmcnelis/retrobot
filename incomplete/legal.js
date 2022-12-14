

    // LEGAL
    if (commands.legalcom.includes(cmd)) {
        const format = await getDeckFormat(server, message, interaction.channelId)
        if (!format) return
        if (format.category !== 'TCG') return message.channel.send(`Sorry, ${format.category} formats are not supported at this time.`)
        message.channel.send(`Please check your DMs.`)
        const issues = await checkDeckList(message.member, format)
        if (!issues) return

        const { illegalCards, forbiddenCards, limitedCards, semiLimitedCards, unrecognizedCards } = issues
        if (illegalCards.length || forbiddenCards.length || limitedCards.length || semiLimitedCards.length) {      
            let response = [`I'm sorry, ${message.member.user.username}, your deck is not legal for ${format.name} Format. ${server.emoji || format.emoji}`]
            if (illegalCards.length) response = [...response, `\nThe following cards are not included in this format:`, ...illegalCards]
            if (forbiddenCards.length) response = [...response, `\nThe following cards are forbidden:`, ...forbiddenCards]
            if (limitedCards.length) response = [...response, `\nThe following cards are limited:`, ...limitedCards]
            if (semiLimitedCards.length) response = [...response, `\nThe following cards are semi-limited:`, ...semiLimitedCards]
            
            for (let i = 0; i < response.length; i += 50) {
                if (response[i+50] && response[i+50].startsWith("\n")) {
                    message.author.send({ content: response.slice(i, i+51).join('\n').toString()}).catch((err) => console.log(err))
                    i++
                } else {
                    message.author.send({ content: response.slice(i, i+50).join('\n').toString()}).catch((err) => console.log(err))
                }
            }
        } else if (unrecognizedCards.length) {
            let response = `I'm sorry, ${message.author.username}, the following card IDs were not found in our database:\n${unrecognizedCards.join('\n')}`
            response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact the Tournament Organizer or the Admin if you can't resolve this.`
            return message.author.send({ content: response.toString() }).catch((err) => console.log(err))
        } else {
            return message.author.send({ content: `Congrats, your ${format.name} Format deck is perfectly legal! ${format.emoji}`}).catch((err) => console.log(err))
        }
    }