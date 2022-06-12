
const { db } = require('./db')
const BlogPost = require('./BlogPost')
const Card = require('./Card')
const Deck = require('./Deck')
const DeckType = require('./DeckType')
const Entry = require('./Entry')
const Event = require('./Event')
const Format = require('./Format')
const Info = require('./Info')
const Iron = require('./Iron')
const Match = require('./Match')
const Matchup = require('./Matchup')
const Membership = require('./Membership')
const Player = require('./Player')
const Print = require('./Print')
const RatedDeck = require('./RatedDeck')
const RatedPool = require('./RatedPool')
const Role = require('./Role')
const Server = require('./Server')
const Set = require('./Set')
const Stats = require('./Stats')
const Status = require('./Status')
const Tournament = require('./Tournament')

Player.hasMany(BlogPost)
BlogPost.belongsTo(Player)

Stats.belongsTo(Player)
Player.hasMany(Stats)

Membership.belongsTo(Player)
Player.hasMany(Membership)

Role.belongsTo(Membership)
Membership.hasMany(Role)

RatedPool.belongsTo(Player)
Player.hasMany(RatedPool)

Iron.belongsTo(Player)
Player.hasMany(Iron)

Entry.belongsTo(Player)
Player.hasMany(Entry)

Entry.belongsTo(Tournament)
Tournament.hasMany(Entry)

Tournament.belongsTo(Event)
Event.hasOne(Tournament)

Status.belongsTo(Card)
Card.hasMany(Status)

Print.belongsTo(Card)
Card.hasMany(Print)

Print.belongsTo(Set)
Set.hasMany(Print)

Matchup.belongsTo(Match)
Match.hasOne(Matchup)

Matchup.belongsTo(Tournament)
Tournament.hasMany(Matchup)

Stats.belongsTo(Server)
Server.hasMany(Stats)

Match.belongsTo(Server)
Server.hasMany(Match)

Membership.belongsTo(Server)
Server.hasMany(Membership)

Player.hasMany(RatedDeck)
RatedDeck.belongsTo(Player)

Player.hasMany(Deck)
Deck.belongsTo(Player)

Event.hasMany(Deck)
Deck.belongsTo(Event)

DeckType.hasMany(Deck)
Deck.belongsTo(DeckType)

module.exports = {
  db,
  BlogPost,
  Card,
  Deck,
  DeckType,
  Entry,
  Event,
  Format,
  Info,
  Iron,
  Match,
  Matchup,
  Membership,
  Player,
  Print,
  RatedDeck,
  RatedPool,
  Role,
  Server,
  Set,
  Stats,
  Status,
  Tournament
}
