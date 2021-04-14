
const db = require('./db')
const Match = require('./match')
const Matchup = require('./matchup')
const Player = require('./player')
const Tournament = require('./tournament')

const YugiKaiba = require('./yugi-kaiba')
const Critter = require('./critter')
const Android = require('./android')
const Yata = require('./yata')
const Vampire = require('./vampire')
const TradChaos = require('./trad-chaos')
const ChaosWarrior = require('./chaos-warrior')
const Goat = require('./goat')
const CRVGoat = require('./crv-goat')
const Reaper = require('./reaper')
const ChaosReturn = require('./chaos-return')
const Stein = require('./stein')
const TroopDup = require('./troop-dup')
const PerfectCircle = require('./perfect-circle')
const DADReturn = require('./dad-return')
const GladBeast = require('./glad-beast')
const TeleDAD = require('./tele-dad')
const DarkStrike = require('./dark-strike')
const Lightsworn = require('./lightsworn')
const Edison = require('./edison')
const Frog = require('./frog')
const SixSamurai = require('./six-samurai')
const Providence = require('./providence')
const TenguPlant = require('./tengu-plant')
const LongBeach = require('./long-beach')
const DinoRabbit = require('./dino-rabbit')
const WindUp = require('./wind-up')
const Meadowlands = require('./meadowlands')
const BabyRuler = require('./baby-ruler')
const RavineRuler = require('./ravine-ruler')
const FireWater = require('./fire-water')
const HAT = require('./hat')
const Shaddoll = require('./shaddoll')
const London = require('./london')
const BurningAbyss = require('./burning-abyss')
const Charleston = require('./charleston')
const Nekroz = require('./nekroz')
const Clown = require('./clown')
const PePe = require('./pe-pe')
const DracoPal = require('./draco-pal')
const Monarch = require('./monarch')
const ABC = require('./abc')
const GrassZoo = require('./grass-zoo')
const DracoZoo = require('./draco-zoo')
const LinkZoo = require('./link-zoo')
const QuickFix = require('./quick-fix')
const Tough = require('./tough')
const Magician = require('./magician')
const Gouki = require('./gouki')
const Danger = require('./danger')
const PrankKids = require('./prank-kids')
const SkyStriker = require('./sky-striker')
const ThunderDragon = require('./thunder-dragon')
const LunalightOrcust = require('./lunalight-orcust')
const StrikerOrcust = require('./striker-orcust')
const Adamancipator = require('./adamancipator')
const Infernoble = require('./infernoble')

const Current = require('./current')
const Traditional = require('./traditional')
const Rush = require('./rush')
const Speed = require('./speed')
const Nova = require('./nova')
const Rebirth = require('./rebirth')

Tournament.belongsTo(Player)
Player.hasOne(Tournament)

YugiKaiba.belongsTo(Player)
Player.hasOne(YugiKaiba)

Critter.belongsTo(Player)
Player.hasOne(Critter)

Android.belongsTo(Player)
Player.hasOne(Android)

Yata.belongsTo(Player)
Player.hasOne(Yata)

Vampire.belongsTo(Player)
Player.hasOne(Vampire)

TradChaos.belongsTo(Player)
Player.hasOne(TradChaos)

ChaosWarrior.belongsTo(Player)
Player.hasOne(ChaosWarrior)

Goat.belongsTo(Player)
Player.hasOne(Goat)

CRVGoat.belongsTo(Player)
Player.hasOne(CRVGoat)

Reaper.belongsTo(Player)
Player.hasOne(Reaper)

ChaosReturn.belongsTo(Player)
Player.hasOne(ChaosReturn)

Stein.belongsTo(Player)
Player.hasOne(Stein)

TroopDup.belongsTo(Player)
Player.hasOne(TroopDup)

PerfectCircle.belongsTo(Player)
Player.hasOne(PerfectCircle)

DADReturn.belongsTo(Player)
Player.hasOne(DADReturn)

GladBeast.belongsTo(Player)
Player.hasOne(GladBeast)

TeleDAD.belongsTo(Player)
Player.hasOne(TeleDAD)

DarkStrike.belongsTo(Player)
Player.hasOne(DarkStrike)

Lightsworn.belongsTo(Player)
Player.hasOne(Lightsworn)

Edison.belongsTo(Player)
Player.hasOne(Edison)

Frog.belongsTo(Player)
Player.hasOne(Frog)

SixSamurai.belongsTo(Player)
Player.hasOne(SixSamurai)

Providence.belongsTo(Player)
Player.hasOne(Providence)

TenguPlant.belongsTo(Player)
Player.hasOne(TenguPlant)

LongBeach.belongsTo(Player)
Player.hasOne(LongBeach)

DinoRabbit.belongsTo(Player)
Player.hasOne(DinoRabbit)

WindUp.belongsTo(Player)
Player.hasOne(WindUp)

Meadowlands.belongsTo(Player)
Player.hasOne(Meadowlands)

BabyRuler.belongsTo(Player)
Player.hasOne(BabyRuler)

RavineRuler.belongsTo(Player)
Player.hasOne(RavineRuler)

FireWater.belongsTo(Player)
Player.hasOne(FireWater)

HAT.belongsTo(Player)
Player.hasOne(HAT)

Shaddoll.belongsTo(Player)
Player.hasOne(Shaddoll)

London.belongsTo(Player)
Player.hasOne(London)

BurningAbyss.belongsTo(Player)
Player.hasOne(BurningAbyss)

Charleston.belongsTo(Player)
Player.hasOne(Charleston)

Nekroz.belongsTo(Player)
Player.hasOne(Nekroz)

Clown.belongsTo(Player)
Player.hasOne(Clown)

PePe.belongsTo(Player)
Player.hasOne(PePe)

DracoPal.belongsTo(Player)
Player.hasOne(DracoPal)

Monarch.belongsTo(Player)
Player.hasOne(Monarch)

ABC.belongsTo(Player)
Player.hasOne(ABC)

GrassZoo.belongsTo(Player)
Player.hasOne(GrassZoo)

DracoZoo.belongsTo(Player)
Player.hasOne(DracoZoo)

LinkZoo.belongsTo(Player)
Player.hasOne(LinkZoo)

QuickFix.belongsTo(Player)
Player.hasOne(QuickFix)

Tough.belongsTo(Player)
Player.hasOne(Tough)

Magician.belongsTo(Player)
Player.hasOne(Magician)

Gouki.belongsTo(Player)
Player.hasOne(Gouki)

Danger.belongsTo(Player)
Player.hasOne(Danger)

PrankKids.belongsTo(Player)
Player.hasOne(PrankKids)

SkyStriker.belongsTo(Player)
Player.hasOne(SkyStriker)

ThunderDragon.belongsTo(Player)
Player.hasOne(ThunderDragon)

LunalightOrcust.belongsTo(Player)
Player.hasOne(LunalightOrcust)

StrikerOrcust.belongsTo(Player)
Player.hasOne(StrikerOrcust)

Adamancipator.belongsTo(Player)
Player.hasOne(Adamancipator)

Infernoble.belongsTo(Player)
Player.hasOne(Infernoble)


Current.belongsTo(Player)
Player.hasOne(Current)

Traditional.belongsTo(Player)
Player.hasOne(Traditional)

Rush.belongsTo(Player)
Player.hasOne(Rush)

Speed.belongsTo(Player)
Player.hasOne(Speed)

Nova.belongsTo(Player)
Player.hasOne(Nova)

Rebirth.belongsTo(Player)
Player.hasOne(Rebirth)


module.exports = {
  db,
  Match,
  Matchup,
  Player,
  Tournament,
  YugiKaiba,
  Critter,
  Android,
  Yata,
  Vampire,
  TradChaos,
  ChaosWarrior,
  Goat,
  CRVGoat,
  Reaper,
  ChaosReturn,
  Stein,
  TroopDup,
  PerfectCircle,
  DADReturn,
  GladBeast,
  TeleDAD,
  DarkStrike,
  Lightsworn,
  Edison,
  Frog,
  SixSamurai,
  Providence,
  TenguPlant,
  LongBeach,
  DinoRabbit,
  WindUp,
  Meadowlands,
  BabyRuler,
  RavineRuler,
  FireWater,
  HAT,
  Shaddoll,
  London,
  BurningAbyss,
  Charleston,
  Nekroz,
  Clown,
  PePe,
  DracoPal,
  Monarch,
  ABC,
  GrassZoo,
  DracoZoo,
  LinkZoo,
  QuickFix,
  Tough,
  Magician,
  Gouki,
  Danger,
  PrankKids,
  SkyStriker,
  ThunderDragon,
  LunalightOrcust,
  StrikerOrcust,
  Adamancipator,
  Infernoble,
  Current,
  Traditional,
  Rush,
  Speed,
  Nova,
  Rebirth
}
