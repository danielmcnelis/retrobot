
const { db } = require('./db')
const Card = require('./Card')
const Entry = require('./Entry')
const Match = require('./Match')
const Matchup = require('./Matchup')
const Membership = require('./Membership')
const Player = require('./Player')
const Queue = require('./Queue')
const Role = require('./Role')
const Stats = require('./Stats')
const Status = require('./Status')
const Tournament = require('./Tournament')

Stats.belongsTo(Player)
Player.hasMany(Stats)

Membership.belongsTo(Player)
Player.hasMany(Membership)

Role.belongsTo(Membership)
Membership.hasMany(Role)

Entry.belongsTo(Player)
Player.hasMany(Entry)

Entry.belongsTo(Tournament)
Tournament.hasMany(Entry)

Queue.belongsTo(Player)
Player.hasMany(Queue)

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
  Match,
  Matchup,
  Membership,
  Player,
  Queue,
  Role,
  Stats,
  Status,
  Tournament
}
