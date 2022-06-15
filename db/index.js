
const { db } = require('./db')
const BlogPost = require('./BlogPost')
const Card = require('./Card')
const Deck = require('./Deck')
const DeckThumb = require('./DeckThumb')
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

//DECKTYPE
DeckType.hasMany(Deck)
Deck.belongsTo(DeckType)

DeckType.hasMany(DeckThumb)
DeckThumb.belongsTo(DeckType)

//ENTRY
Entry.belongsTo(Player)
Player.hasMany(Entry)

Entry.belongsTo(Tournament)
Tournament.hasMany(Entry)

//EVENT
Event.hasMany(Deck)
Deck.belongsTo(Event)

Event.belongsTo(Tournament)
Tournament.hasOne(Event)

//IRON
Iron.belongsTo(Player)
Player.hasMany(Iron)

//MATCH
Match.belongsTo(Server)
Server.hasMany(Match)

//MATCHUP
Matchup.belongsTo(Match)
Match.hasOne(Matchup)

Matchup.belongsTo(Tournament)
Tournament.hasMany(Matchup)

//MEMBERSHIP
Membership.belongsTo(Player)
Player.hasMany(Membership)

Membership.belongsTo(Server)
Server.hasMany(Membership)

//PLAYER
Player.hasMany(BlogPost)
BlogPost.belongsTo(Player)

Player.hasMany(Deck)
Deck.belongsTo(Player)

Player.hasMany(Event)
Event.belongsTo(Player)

Player.hasMany(RatedDeck)
RatedDeck.belongsTo(Player)

//PRINT
Print.belongsTo(Card)
Card.hasMany(Print)

Print.belongsTo(Set)
Set.hasMany(Print)

//RATED POOL
RatedPool.belongsTo(Player)
Player.hasMany(RatedPool)

//ROLE
Role.belongsTo(Membership)
Membership.hasMany(Role)

//STATS
Stats.belongsTo(Player)
Player.hasMany(Stats)

Stats.belongsTo(Server)
Server.hasMany(Stats)

//STATUS
Status.belongsTo(Card)
Card.hasMany(Status)

//TOURNAMENT
Tournament.belongsTo(Server)
Server.hasMany(Tournament)

module.exports = {
  db,
  BlogPost,
  Card,
  Deck,
  DeckThumb,
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
