# RetroBot

A sleek Discord bot for hosting tournaments, matchmaking, and leaderboards for a wide range of different Yu-Gi-Oh! TCG formats. It is also by far the highest quality Discord bot for looking up Yu-Gi-Oh! cards, displaying key information such as: release date, original print and rarity, forbidden/limited status, and emojis for attribute, spell/trap icons, star icons, and monster types.

Features are gated behind access tiers: Free, Affiliate ($15 setup), Partner ($40 setup + $20 annually). A handful of features such as access to Rated Play for all formats will remain Format Library exclusives.

Add this bot to your Discord server: https://discord.bots.gg/bots/730922003296419850

For additional help: contact me on Discord at Jazz#2704

# Tournament Host Functions - Partner Tier

RetroBot makes it easy to run large, real-time Yu-Gi-Oh! tournaments from your Discord server.
\n• RetroBot connects to Challonge.com via your Challonge API Key to manage tournament brackets.
\n• Hosts create new tournament brackets on their Challonge accounts with **!create**.
\n• Players register for tournaments with **!join** and submit a deck (via duelingbook.com/deck link).
\n• Hosts can register players for tournaments with **!signup @player**.
\n• RetroBot saves players's decks as .YDKs and checks their legality when they register.
\n• RetroBot adds players to brackets on Challonge and removes them if they **!drop**.
\n• Hosts can remove players from tournaments with **!remove @player**.
\n• Hosts can control registration windows with **!close** and **!open**.
• Hosts **!start** the tournament, which triggers seeding based on players's rankings.
• Players are notified when paired and the loser of the match is asked to report with **!loss @opponent**.
• Hosts can directly manage the bracket with **!noshow @player** or **!manual @winner @loser**.
• Hosts and Judges can inspect decks with **!deck @player**.
• Players and spectators can view the Challonge bracket with **!bracket**.
• Hosts **!end** the tournament, which uploads a spreadsheet summary and .YDKs to your Google Drive.
• Hosts can delete unstarted tournaments on their Challonge accounts with **!destroy**.
• Hosts can time rounds if desired with **!timer n**, where n = number of minutes.

# Rated Play and Matchmaking Functions - Affiliate Tier

RetroBot allows your Discord users to participate in FormatLibrary.com sanctioned Rated Play for one (1) format of your choosing. This includes the popular matchmaking and leaderboard systems.
• Players can anonymously join rated pools by DM'ing **!rated** to RetroBot.
• Players indicate which FormatLibrary.com supported Yu-Gi-Oh! format they wish to play.
• Players submit a deck (via duelingbook.com/deck link) or select a previously submitted deck for Rated Play.
• RetroBot saves players's decks as .YDKs and checks their legality when they join pools.
• RetroBot creates a Node Canvas drawing of a player's deck to show them what they selected.
• RetroBot posts a notification in all servers and channels that support that specific Rated Pool when someone joins.
• RetroBot attempts to match players who (1) share a common Discord server and (2) have not played each other recently.
• Any player waiting in the pool less than 10 minutes must play if matched, otherwise they need to reconfirm.
• Players can leave a Rated Pool at any time by DM'ing **!exit** to RetroBot.
• When 2 players are successfully paired, they receive a DM telling them (1) who to play and (2) the host Discord server.
• Players are asked to report match results with **!loss @opponent**.
• Moderators can report a result for other players with **!manual @winner @loser**.
• RetroBot calculates the resulting change in Elo and updates both players's stats for the format they played.
• Players can undo their own report and Moderators can undo any report with **!undo** if a mistake is made.
• Players can check their stats (ranking, Elo, medal, W/L record) or another player's with **!stats** or **!stats @player**.
• Players can view the current leaderboard with **!top n**, where n = desired cutoff (default is 10).
• Players can view a graph of their Elo history with **!hist n**, where n = number of recent matches (default is 250).
• Players can check their head-to-head record against another player with **!h2h @player**.

# Format Information Functions - Free Tier

RetroBot provides useful information about various Yu-Gi-Oh! formats, decks, and players.
• Players can view the Forbidden and Limited lists governing any format with **!banlist**.
• Players can check deck legality with **!legal** and they DM their deck to RetroBot (via duelingbook.com/deck link).
• Players can check their FormatLibrary.com profile or another player's with **!profile** or **!profile @player**.

# Card Search Function - Free Tier

RetroBot is the most powerful Discord bot for looking up Yu-Gi-Oh! cards. Cards are updated every day at midnight EST.
• Users can search for cards with **{Card Name}**.
• Users can set the format for their server with **!format**.
• RetroBot displays found cards in visually appealing Discord Message Embeds using colorful emojis and high quality images.
• RetroBot links to the card's Mobile-friendly FormatLibrary.com webpage, which provides more extensive information.
• RetroBot displays legality and forbidden/limited status in Affiliate/Partner servers, or if a format is manually set.
• Free Tier users can set the format for their server one (1) time with **!format**. To change this please contact me.
