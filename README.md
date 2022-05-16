# RetroBot

A sleek Discord bot for hosting tournaments, matchmaking, and leaderboards for a wide range of different Yu-Gi-Oh! TCG formats. It is also by far the highest quality Discord bot for looking up Yu-Gi-Oh! cards, displaying key information such as: release date, original print and rarity, Forbidden/Limited status, and emojis for Attribute, Spell/Trap icons, Star icons, and Monster-types.

Features are gated behind access tiers: Free, Affiliate ($15 setup), Partner ($40 setup + $20 annually). A handful of features such as access to Rated Play for all formats will remain Format Library exclusives.

This app was built with Discord.js (user interaction and front-end output), FuzzySet (card search algorithms), Canvas (drawing decks), QuickChart (plotting charts), Axios (fetching external data), PostgreSQL (internal database), and Sequelize (interacting with internal database).

Click here to add this bot to your Discord server: https://discord.bots.gg/bots/730922003296419850<br/>
For additional help: contact me on Discord at Jazz#2704

![Bot Profile](/public/Bot-Profile.png)

# Tournament Host - Partner Tier

RetroBot makes it easy to run large, real-time Yu-Gi-Oh! tournaments from your Discord server.

• RetroBot connects to Challonge.com via your Challonge API Key to manage tournament brackets.<br/>
• Hosts create new tournament brackets on their Challonge accounts with **!create**.<br/>
• Players register for tournaments with **!join** and submit a deck (via duelingbook.com/deck link).<br/>
• Hosts can register players for tournaments with **!signup @player**.<br/>
• RetroBot saves players's decks as .YDKs and checks their legality when they register.<br/>
• RetroBot adds players to brackets on Challonge and removes them if they **!drop**.<br/>

![Tournament Registration](/public/Tournament-Registration.png)

• Hosts can remove players from tournaments with **!remove @player**.<br/>
• Hosts can control registration windows with **!close** and **!open**.<br/>
• Hosts **!start** the tournament, which triggers seeding based on players's rankings.<br/>
• Players are notified when paired and the loser of the match is asked to report with **!loss @opponent**.<br/>
• Hosts can directly manage the bracket with **!noshow @player** or **!manual @winner @loser**.<br/>
• Hosts and Judges can inspect decks with **!deck @player**.<br/>
• Players and spectators can view the Challonge bracket with **!bracket**.<br/>
• Hosts **!end** the tournament, which uploads a spreadsheet summary and .YDKs to your Google Drive.<br/>
• Hosts can delete unstarted tournaments on their Challonge accounts with **!destroy**.<br/>
• Hosts can time rounds if desired with **!timer n**, where n = number of minutes.<br/>

![Tournament Hosting](/public/Tournament-Hosting.png)

# Matchmaking - Affiliate Tier

RetroBot allows your Discord users to participate in a matchmaking system for one (1) format of your choosing.

• Players can anonymously join rated pools by DM'ing **!rated** to RetroBot.<br/>
• Players indicate which FormatLibrary.com supported Yu-Gi-Oh! format they wish to play.<br/>
• Players submit a deck (via duelingbook.com/deck link) or select a previously submitted deck for Rated Play.<br/>
• RetroBot saves players's decks as .YDKs and checks their legality when they join pools.<br/>
• RetroBot creates a Node Canvas drawing of a player's deck to show them what they selected.<br/>

![Rated Pairing](/public/Join-Rated.png)

• RetroBot posts a notification in all servers and channels that support that Rated Pool when someone joins.<br/>
• RetroBot attempts to match players who (1) share a common Discord server and (2) have not played recently.<br/>
• Any player waiting in the pool less than 10 minutes must play if matched, otherwise they need to reconfirm.<br/>
• Players can leave a Rated Pool at any time by DM'ing **!exit** to RetroBot.<br/>
• When 2 players are successfully paired, they (1) receive a DM telling them who to play, and (2) RetroBot announces the pairing in the host server.<br/>

![Rated Pairing](/public/Rated-Pairing.png)

# Rated Play - Affiliate Tier

RetroBot grants your server access to FormatLibrary.com Rated Play for one (1) format of your choosing.

• Players are asked to report match results with **!loss @opponent**.<br/>
• Moderators can report a result for other players with **!manual @winner @loser**.<br/>
• RetroBot calculates the resulting change in Elo and updates both players's stats for the format they played.<br/>
• Players can undo their own report and Moderators can undo any report with **!undo** if a mistake is made.<br/>
• Players can check their stats (ranking, Elo, medal, W/L record) or another player's with **!stats** or **!stats @player**.<br/>

![Stats](/public/Stats.png)

• Players can view the current leaderboard with **!top n**, where n = desired cutoff (default is 10).<br/>
• Players can view a graph of their Elo history with **!hist n**, where n = number of recent matches (default is 250).<br/>
• Players can check their head-to-head record against another player with **!h2h @player**.<br/>

![History](/public/History.png)

# Format Information - Free Tier

RetroBot provides useful information about various Yu-Gi-Oh! formats, decks, and players.

• Players can view the Forbidden and Limited lists governing any format with **!banlist**.<br/>
• Players can check deck legality with **!legal** and they DM their deck to RetroBot (via duelingbook.com/deck link).<br/>
• Players can check their FormatLibrary.com profile or another player's with **!profile** or **!profile @player**.<br/>

![Legality Check](/public/Legality-Check.png)

# Card Search - Free Tier

RetroBot is the most powerful Discord bot for looking up Yu-Gi-Oh! cards. Cards are updated nightly.

• Discord users can search for cards with **{Card Name}**.<br/>
• RetroBot posts results in visually appealing Discord Message Embeds using colorful emojis and quality images.<br/>
• RetroBot links the card's mobile-friendly FormatLibrary.com webpage, which provides further information.<br/>
• RetroBot automatically displays legality and forbidden/limited status in Affiliate/Partner servers.<br/>
• Free Tier users can set the format for their server one (1) time with **!format**. To change this please contact me.<br/>

![Card Search](/public/Card-Search.png)
