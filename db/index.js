
const { db, db2 } = require('./db')
const Backups = require('./backups')
const Card = require('./card')
const Entry = require('./entry')
const Losses = require('./losses')
const Match = require('./match')
const Matchup = require('./matchup')
const Player = require('./player')
const Stats = require('./stats')
const Status = require('./status')
const Tournament = require('./tournament')
const Wins = require('./wins')

Backups.belongsTo(Player)
Player.hasOne(Backups)

Losses.belongsTo(Player)
Player.hasOne(Losses)

Stats.belongsTo(Player)
Player.hasOne(Stats)

Wins.belongsTo(Player)
Player.hasOne(Wins)

Entry.belongsTo(Player)
Player.hasMany(Entry)

Entry.belongsTo(Tournament)
Tournament.hasMany(Entry)

Status.belongsTo(Card)
Card.hasOne(Status)

Matchup.belongsTo(Match)
Match.hasOne(Matchup)

Matchup.belongsTo(Tournament)
Tournament.hasMany(Matchup)

module.exports = {
  db,
  db2,
  Backups,
  Card,
  Entry,
  Losses,
  Match,
  Matchup,
  Player,
  Stats,
  Status,
  Tournament,
  Wins
}
