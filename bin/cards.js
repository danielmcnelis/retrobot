
const { db, Card, Status } = require('../db/index.js')
const cards = require('../static/cards.json')
const statuses = require('../static/statuses.json')

const createCards = async () => {
  const card_data = cards['data'].sort((a, b) => {
    if (a.name < b.name) {
      return -1
    }
    if (a.name > b.name) {
      return 1
    } else {
      return 0
    }
  })

  for (let i = 0; i < card_data.length; i++) {
    const card = card_data[i]
    let konami_code = card.image.slice(0, -4)
    while (konami_code.length < 8) konami_code = '0' + konami_code
    const icon = card.card === 'Spell' || card.card === 'Trap' ? card.category : null
    const normal = card.card === 'Monster' && (card.category === 'Normal' || card.class === 'Normal' || card.subclass === 'Normal')
    const effect = !normal && card.card === 'Monster'
    const fusion = card.card === 'Monster' && (card.category === 'Fusion' || card.class === 'Fusion' || card.subclass === 'Fusion')
    const ritual = card.card === 'Monster' && (card.category === 'Ritual' || card.class === 'Ritual' || card.subclass === 'Ritual')
    const synchro = card.card === 'Monster' && (card.category === 'Synchro' || card.class === 'Synchro' || card.subclass === 'Synchro')
    const xyz = card.card === 'Monster' && (card.category === 'Xyz' || card.class === 'Xyz' || card.subclass === 'Xyz')
    const pendulum = card.card === 'Monster' && (card.category === 'Pendulum' || card.class === 'Pendulum' || card.subclass === 'Pendulum')
    const link = card.card === 'Monster' && (card.category === 'Link' || card.class === 'Link' || card.subclass === 'Link')
    const flip = card.card === 'Monster' && (card.class === 'Flip' || card.subclass === 'Flip')
    const gemini = card.card === 'Monster' && (card.class === 'Gemini' || card.subclass === 'Gemini')
    const spirit = card.card === 'Monster' && (card.class === 'Spirit' || card.subclass === 'Spirit')
    const toon = card.card === 'Monster' && (card.class === 'Toon' || card.subclass === 'Toon')
    const tuner = card.card === 'Monster' && (card.class === 'Tuner' || card.subclass === 'Tuner')
    const union = card.card === 'Monster' && (card.class === 'Union' || card.subclass === 'Union')
    const level = card.card === 'Monster' && !link ? card.level : null
    const rating = card.card === 'Monster' && link ? card.level : null
  
    await Card.create({
      name: card.name,
      konami_code: konami_code,
      tcg_legal: true,
      ocg_legal: true,
      image_file: card.image,
      category: card.card,
      icon: icon,
      normal: normal,
      effect: effect,
      fusion: fusion,
      ritual: ritual,
      synchro: synchro, 
      xyz: xyz,
      pendulum: pendulum,
      link: link,
      flip: flip,
      gemini: gemini,
      spirit: spirit,
      toon: toon,
      tuner: tuner,
      union: union,
      attribute: card.attribute,
      type: card.type,
      level: level,
      rating: rating,
      arrows: null,
      scale: null,
      atk: card.atk,
      def: card.def,
      description: card.description,
      tcg_date: card.date,
      ocg_date: null
    })
  }
  
  const status_data = statuses['data'].sort((a, b) => {
    if (a.name < b.name) {
      return -1
    }
    if (a.name > b.name) {
      return 1
    } else {
      return 0
    }
  })
  
  for (let i = 0; i < status_data.length; i++) {
    const status = status_data[i]
    const card = await Card.findOne({ where: { name: status.name }})
    if (!card) {
      continue
    }
  
    const cardId = card.id
  
    await Status.create({
        name: status.name,
        may02: status.may02,
        jul02: status.jul02,
        oct02: status.oct02,
        dec02: status.dec02,
        apr03: status.apr03,
        may03: status.may03,
        jul03: status.jul03,
        aug03: status.aug03,
        nov03: status.nov03,
        feb04: status.feb04,
        apr04: status.apr04,
        oct04: status.oct04,
        apr05: status.apr05,
        oct05: status.oct05,
        apr06: status.apr06,
        sep06: status.sep06,
        mar07: status.mar07,
        jun07: status.jun07,
        sep07: status.sep07,
        mar08: status.mar08,
        may08: status.may08,
        sep08: status.sep08,
        mar09: status.mar09,
        sep09: status.sep09,
        mar10: status.mar10,
        sep10: status.sep10,
        mar11: status.mar11,
        sep11: status.sep11,
        mar12: status.mar12,
        sep12: status.sep12,
        mar13: status.mar13,
        sep13: status.sep13,
        oct13: status.oct13,
        jan14: status.jan14,
        apr14: status.apr14,
        jul14: status.jul14,
        oct14: status.oct14,
        jan15: status.jan15,
        apr15: status.apr15,
        jul15: status.jul15,
        nov15: status.nov15,
        feb16: status.nov15,
        apr16: status.apr16,
        aug16: status.aug16,
        mar17: status.mar17,
        jun17: status.jun17,
        sep17: status.sep17,
        nov17: status.nov17,
        feb18: status.feb18,
        may18: status.may18,
        sep18: status.sep18,
        dec18: status.dec18,
        jan19: status.jan19,
        apr19: status.apr19,
        jul19: status.jul19,
        oct19: status.oct19,
        jan20: status.jan20,
        apr20: status.apr20,
        jun20: status.jun20,
        sep20: status.sep20,
        dec20: status.dec20,
        mar21: status.mar21,
        cardId: cardId
      })
  }
}

createCards()