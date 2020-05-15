
const db = require('./db')
const Player = require('./player')
const Match = require('./match')
const Matchup = require('./matchup')
const Replay = require('./replay')
const Deck = require('./deck')
const Tournament = require('./tournament')

Tournament.belongsTo(Player)
Player.hasOne(Tournament)

Deck.belongsTo(Player)
Player.hasMany(Deck)

Replay.belongsTo(Player)
Player.hasMany(Replay)

module.exports = {
  db,
  Player,
  Match,
  Matchup,
  Replay,
  Deck,
  Tournament
}
