
const { db } = require('./db')
const Card = require('./Card')
const Entry = require('./Entry')
const Format = require('./Format')
const Info = require('./Info')
const Iron = require('./Iron')
const Match = require('./Match')
const Matchup = require('./Matchup')
const Membership = require('./Membership')
const Player = require('./Player')
const Role = require('./Role')
const Server = require('./Server')
const Stats = require('./Stats')
const Status = require('./Status')
const Tournament = require('./Tournament')

Stats.belongsTo(Player)
Player.hasMany(Stats)

Membership.belongsTo(Player)
Player.hasMany(Membership)

Role.belongsTo(Membership)
Membership.hasMany(Role)

Iron.belongsTo(Player)
Player.hasMany(Iron)

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
  Card,
  Entry,
  Format,
  Info,
  Iron,
  Match,
  Matchup,
  Membership,
  Player,
  Role,
  Server,
  Stats,
  Status,
  Tournament
}
