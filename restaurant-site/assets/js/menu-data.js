/*
 * Menu data for Char Kuey Teow Abang Chor.
 *
 * This is the only file you need to edit to change the menu — index.html
 * renders everything from here. Prices are in Malaysian Ringgit (RM).
 *
 * Item fields:
 *   id     unique slug, used for the "My Picks" list saved in the browser
 *   cat    category id, must match one of the categories below
 *   name   English / common name
 *   malay  Malay name shown under the English one
 *   desc   one or two lines describing the dish
 *   price  number, in RM. Use `priceNote` for "from RM12" style pricing
 *   spice  0 = not spicy, 1 = mild, 2 = medium, 3 = fiery
 *   tags   any of: vegetarian, vegan, seafood, shellfish, nuts, egg, chicken,
 *          dairy, seasonal
 *   pick   true to show the "Abang's pick" badge
 *   art    how the dish illustration is drawn — see assets/js/dish-art.js.
 *          { vessel, base, toppings } where vessel is plate | bowl | dessert |
 *          glass, base is the noodle/rice/broth/drink colour, and toppings is
 *          a list of garnish names the art module knows how to draw.
 */

const RESTAURANT = {
  name: 'Char Kuey Teow Abang Chor',
  shortName: 'Abang Chor',
  tagline: 'Charcoal wok, nightly',
  blurb:
    'One wok, one plate at a time, from 6pm until the kuey teow runs out. ' +
    'No pork, no lard — everything fried in vegetable oil.',
  address: 'Gerai 4, Medan Selera Jalan Besar, 36800 Kampung Gajah, Perak',
  phone: '+60 12-537 4180',
  whatsapp: '60125374180',
  email: 'bungkus@abangchor.example',
  hours: [
    { days: 'Monday – Thursday', time: '6:00pm – 11:00pm' },
    { days: 'Friday – Saturday', time: '6:00pm – 11:30pm' },
    { days: 'Sunday', time: '6:00pm – 11:00pm' }
  ],
  lastOrder: 'Last order 10:45pm, earlier on a busy night'
};

const CATEGORIES = [
  {
    id: 'ckt',
    name: 'Char Kuey Teow',
    malay: 'Yang Kami Terkenal',
    icon: 'icon-wok',
    blurb: 'Flat rice noodles, one plate per fry, over a charcoal flame. Cockles go in unless you say otherwise.'
  },
  {
    id: 'goreng',
    name: 'Other Wok Plates',
    malay: 'Goreng-Goreng Lain',
    icon: 'icon-noodles',
    blurb: 'Same wok, same flame, for the ones at the table who do not want kuey teow.'
  },
  {
    id: 'kuah',
    name: 'Soup & Gravy',
    malay: 'Berkuah',
    icon: 'icon-soup',
    blurb: 'Ladled from the pot at the end of the stall. Good on a wet night.'
  },
  {
    id: 'sampingan',
    name: 'Sides',
    malay: 'Sampingan',
    icon: 'icon-satay',
    blurb: 'Small plates to pass around while you wait for your turn at the wok.'
  },
  {
    id: 'manis',
    name: 'Sweets',
    malay: 'Manis',
    icon: 'icon-dessert',
    blurb: 'Shaved ice and gula melaka, from the stall two doors down. We fetch it for you.'
  },
  {
    id: 'minuman',
    name: 'Drinks',
    malay: 'Minuman',
    icon: 'icon-drink',
    blurb: 'Iced and sweet, the way they come at a medan selera.'
  }
];

const ITEMS = [
  /* ------------------------------------------------ char kuey teow ---- */
  {
    id: 'ckt-biasa',
    cat: 'ckt',
    name: 'Char Kuey Teow Biasa',
    malay: 'The Standard Plate',
    desc: 'Flat rice noodles, prawns, cockles, chives, bean sprouts and egg, fried hard in one plate for the wok hei.',
    price: 9.0,
    spice: 1,
    tags: ['seafood', 'shellfish', 'egg'],
    pick: true,
    art: { vessel: 'plate', base: '#6d3f22', toppings: ['prawn', 'cockle', 'egg', 'chive', 'taugeh', 'chilli'] }
  },
  {
    id: 'ckt-telur-itik',
    cat: 'ckt',
    name: 'Char Kuey Teow Telur Itik',
    malay: 'with Duck Egg',
    desc: 'The standard plate with a duck egg cracked in at the end — richer, and the yolk coats every strand.',
    price: 12.0,
    spice: 1,
    tags: ['seafood', 'shellfish', 'egg'],
    art: { vessel: 'plate', base: '#6d3f22', toppings: ['eggyolk', 'prawn', 'cockle', 'chive', 'taugeh'] }
  },
  {
    id: 'ckt-udang-besar',
    cat: 'ckt',
    name: 'Char Kuey Teow Udang Besar',
    malay: 'with Two Big Prawns',
    desc: 'Two butterflied tiger prawns laid on top, seared in the same wok so the shells flavour the noodles.',
    price: 18.0,
    spice: 1,
    tags: ['seafood', 'shellfish', 'egg'],
    art: { vessel: 'plate', base: '#6d3f22', toppings: ['prawnbig', 'prawnbig', 'cockle', 'chive', 'egg'] }
  },
  {
    id: 'ckt-abang-chor',
    cat: 'ckt',
    name: 'Special Abang Chor',
    malay: 'Semua Sekali',
    desc: 'Everything at once: duck egg, two big prawns, extra cockles and a heavier hand on the chilli paste.',
    price: 22.0,
    spice: 2,
    tags: ['seafood', 'shellfish', 'egg'],
    pick: true,
    art: { vessel: 'plate', base: '#6a3820', toppings: ['prawnbig', 'eggyolk', 'cockle', 'cockle', 'chilli', 'chive'] }
  },
  {
    id: 'ckt-kerang-lebih',
    cat: 'ckt',
    name: 'Kerang Lebih',
    malay: 'Extra Cockles',
    desc: 'A double portion of cockles, added at the last second so they stay plump rather than rubbery.',
    price: 12.5,
    spice: 1,
    tags: ['seafood', 'shellfish', 'egg'],
    art: { vessel: 'plate', base: '#6d3f22', toppings: ['cockle', 'cockle', 'cockle', 'chive', 'taugeh', 'egg'] }
  },
  {
    id: 'ckt-tanpa-kerang',
    cat: 'ckt',
    name: 'Tanpa Kerang',
    malay: 'No Cockles',
    desc: 'The standard plate with prawns and egg but no cockles. Say the word and the wok is wiped first.',
    price: 9.0,
    spice: 1,
    tags: ['seafood', 'shellfish', 'egg'],
    art: { vessel: 'plate', base: '#6d3f22', toppings: ['prawn', 'egg', 'chive', 'taugeh'] }
  },
  {
    id: 'ckt-basah',
    cat: 'ckt',
    name: 'Kuey Teow Goreng Basah',
    malay: 'Wet Fried, Egg Gravy',
    desc: 'Fried first, then finished under a thick egg gravy. Softer, and the plate everyone orders in the rain.',
    price: 10.5,
    spice: 1,
    tags: ['seafood', 'shellfish', 'egg'],
    art: { vessel: 'plate', base: '#7a4a26', toppings: ['gravy', 'prawn', 'greens', 'chive'] }
  },
  {
    id: 'ckt-pedas',
    cat: 'ckt',
    name: 'Char Kuey Teow Pedas Gila',
    malay: 'Extra Chilli',
    desc: 'Three spoons of chilli paste instead of one. Abang will ask you twice before he cooks it.',
    price: 9.5,
    spice: 3,
    tags: ['seafood', 'shellfish', 'egg'],
    art: { vessel: 'plate', base: '#7d3319', toppings: ['chilli', 'chilli', 'cockle', 'prawn', 'chive'] }
  },
  {
    id: 'ckt-sayur',
    cat: 'ckt',
    name: 'Char Kuey Teow Sayur',
    malay: 'Vegetarian',
    desc: 'Tofu puffs, bean sprouts, chives and greens, no seafood and no egg. Cooked in a wok kept aside for it.',
    price: 9.5,
    spice: 1,
    tags: ['vegetarian', 'vegan'],
    art: { vessel: 'plate', base: '#7a5a30', toppings: ['tofu', 'taugeh', 'greens', 'chive'] }
  },

  /* -------------------------------------------------- other plates ---- */
  {
    id: 'mee-goreng-basah',
    cat: 'goreng',
    name: 'Mee Goreng Basah',
    malay: 'Wet Fried Yellow Noodles',
    desc: 'Yellow noodles in a sweet-sour chilli gravy with potato, tofu and a beaten egg stirred through.',
    price: 9.5,
    spice: 2,
    tags: ['egg'],
    art: { vessel: 'plate', base: '#c2542a', toppings: ['gravy', 'egg', 'tofu', 'greens'] }
  },
  {
    id: 'bihun-goreng',
    cat: 'goreng',
    name: 'Bihun Goreng',
    malay: 'Fried Rice Vermicelli',
    desc: 'Thin rice vermicelli fried with turmeric, prawns and chives until every strand is separate.',
    price: 9.5,
    spice: 1,
    tags: ['seafood', 'egg'],
    art: { vessel: 'plate', base: '#d8a53a', toppings: ['prawn', 'chive', 'egg', 'taugeh'] }
  },
  {
    id: 'hokkien-char',
    cat: 'goreng',
    name: 'Hokkien Char',
    malay: 'Dark Soy Noodles',
    desc: 'Thick noodles braised down in dark soy with squid, prawn and cabbage until the sauce clings.',
    price: 11.5,
    spice: 0,
    tags: ['seafood', 'shellfish'],
    art: { vessel: 'plate', base: '#41291a', toppings: ['squidring', 'prawn', 'greens'] }
  },
  {
    id: 'nasi-goreng-cina',
    cat: 'goreng',
    name: 'Nasi Goreng Cina',
    malay: 'Fried Rice',
    desc: 'Plain-style fried rice with prawn, egg and spring onion. What the children at the table order.',
    price: 10.0,
    spice: 0,
    tags: ['seafood', 'egg'],
    art: { vessel: 'plate', base: '#e3cfa6', toppings: ['prawn', 'egg', 'chive'] }
  },
  {
    id: 'nasi-goreng-kampung',
    cat: 'goreng',
    name: 'Nasi Goreng Kampung',
    malay: 'Village Fried Rice',
    desc: 'Fried with anchovies, water spinach and a fistful of bird’s eye chilli. Comes with a fried egg on top.',
    price: 10.5,
    spice: 3,
    tags: ['seafood', 'egg'],
    art: { vessel: 'plate', base: '#c9a377', toppings: ['friedegg', 'anchovy', 'chilli', 'greens'] }
  },
  {
    id: 'maggi-goreng',
    cat: 'goreng',
    name: 'Maggi Goreng',
    malay: 'Fried Instant Noodles',
    desc: 'The 10pm order. Instant noodles fried with egg, cabbage and chilli paste, lime on the side.',
    price: 9.0,
    spice: 2,
    tags: ['egg'],
    art: { vessel: 'plate', base: '#d98b34', toppings: ['egg', 'chilli', 'greens', 'lime'] }
  },

  /* -------------------------------------------------- soup & gravy ---- */
  {
    id: 'kuey-teow-sup',
    cat: 'kuah',
    name: 'Kuey Teow Sup Ayam',
    malay: 'Chicken Noodle Soup',
    desc: 'Flat noodles in a clear chicken and white pepper broth, with shredded chicken and fried shallots.',
    price: 9.5,
    spice: 0,
    tags: ['chicken'],
    art: { vessel: 'bowl', base: '#d9b878', toppings: ['chicken', 'chive', 'steam'] }
  },
  {
    id: 'mee-kari',
    cat: 'kuah',
    name: 'Mee Kari',
    malay: 'Curry Noodles',
    desc: 'Coconut curry broth with tofu puffs, cockles, long beans and a spoon of sambal on the rim.',
    price: 11.0,
    spice: 2,
    tags: ['seafood', 'shellfish'],
    art: { vessel: 'bowl', base: '#d97a2b', toppings: ['tofu', 'cockle', 'chilli', 'steam'] }
  },
  {
    id: 'tom-yam-campur',
    cat: 'kuah',
    name: 'Tom Yam Campur',
    malay: 'Mixed Tom Yam Noodles',
    desc: 'Sour and hot, with prawn, squid and fishcake. We cook the noodles separately so they do not go soft.',
    price: 13.0,
    spice: 3,
    tags: ['seafood', 'shellfish'],
    art: { vessel: 'bowl', base: '#c9452f', toppings: ['prawn', 'squidring', 'chilli', 'steam'] }
  },

  /* -------------------------------------------------------- sides ---- */
  {
    id: 'telur-mata',
    cat: 'sampingan',
    name: 'Telur Mata Goreng',
    malay: 'Fried Egg',
    desc: 'Fried in the wok oil so the edges frill and crisp. Put it on anything.',
    price: 2.5,
    spice: 0,
    tags: ['vegetarian', 'egg'],
    art: { vessel: 'plate', base: null, toppings: ['friedegg'] }
  },
  {
    id: 'sotong-goreng',
    cat: 'sampingan',
    name: 'Sotong Goreng Tepung',
    malay: 'Fried Squid Rings',
    desc: 'Squid rings in a light batter with curry leaf, salt and a wedge of calamansi.',
    price: 14.0,
    spice: 1,
    tags: ['seafood', 'shellfish'],
    art: { vessel: 'plate', base: null, toppings: ['squidring', 'squidring', 'lime', 'chilli'] }
  },
  {
    id: 'keropok-lekor',
    cat: 'sampingan',
    name: 'Keropok Lekor',
    malay: 'Fish Sausage, Sliced & Fried',
    desc: 'Terengganu fish sausage, sliced and fried crisp, with a sweet chilli dip.',
    price: 7.0,
    spice: 1,
    tags: ['seafood'],
    art: { vessel: 'plate', base: null, toppings: ['lekor', 'lekor', 'chilli'] }
  },
  {
    id: 'or-chien',
    cat: 'sampingan',
    name: 'Or Chien',
    malay: 'Oyster Omelette',
    desc: 'Small oysters folded into a starchy egg batter, fried until the edges shatter. Chilli sauce on the side.',
    price: 16.0,
    spice: 1,
    tags: ['seafood', 'shellfish', 'egg'],
    pick: true,
    art: { vessel: 'plate', base: null, toppings: ['omelette', 'oyster', 'chilli', 'chive'] }
  },
  {
    id: 'taugeh-goreng',
    cat: 'sampingan',
    name: 'Taugeh Goreng Ikan Masin',
    malay: 'Bean Sprouts with Salted Fish',
    desc: 'Bean sprouts kept crunchy, fried with salted fish and garlic. Thirty seconds in the wok, no more.',
    price: 9.0,
    spice: 1,
    tags: ['seafood'],
    art: { vessel: 'plate', base: null, toppings: ['taugeh', 'taugeh', 'anchovy', 'chilli'] }
  },

  /* ------------------------------------------------------- sweets ---- */
  {
    id: 'cendol',
    cat: 'manis',
    name: 'Cendol',
    malay: 'Pandan Jelly & Gula Melaka',
    desc: 'Shaved ice, coconut milk, green pandan jellies and dark palm sugar poured over at the table.',
    price: 6.5,
    spice: 0,
    tags: ['vegetarian', 'vegan'],
    pick: true,
    art: { vessel: 'dessert', base: '#f3ece0', toppings: ['icemound', 'cendolworm', 'syrup', 'cream'] }
  },
  {
    id: 'ais-kacang',
    cat: 'manis',
    name: 'Ais Kacang',
    malay: 'ABC',
    desc: 'A hill of shaved ice over red bean, sweetcorn and grass jelly, with rose syrup and evaporated milk.',
    price: 7.5,
    spice: 0,
    tags: ['vegetarian', 'nuts', 'dairy'],
    art: { vessel: 'dessert', base: '#f3ece0', toppings: ['icemound', 'redbean', 'corn', 'syrup'] }
  },
  {
    id: 'pisang-goreng',
    cat: 'manis',
    name: 'Pisang Goreng Cheese',
    malay: 'Fried Banana with Cheese',
    desc: 'Banana fritters straight from the oil, grated cheddar over the top while they are still too hot to hold.',
    price: 7.0,
    spice: 0,
    tags: ['vegetarian', 'dairy'],
    art: { vessel: 'plate', base: null, toppings: ['banana', 'banana', 'cheese'] }
  },
  {
    id: 'sago-gula-melaka',
    cat: 'manis',
    name: 'Sago Gula Melaka',
    malay: 'Sago with Palm Sugar',
    desc: 'Chilled sago pearls, thick coconut cream and palm sugar from Melaka.',
    price: 6.5,
    spice: 0,
    tags: ['vegetarian', 'vegan'],
    art: { vessel: 'dessert', base: '#efe6d6', toppings: ['sago', 'syrup', 'cream'] }
  },

  /* ------------------------------------------------------ drinks ---- */
  {
    id: 'teh-o-ais-limau',
    cat: 'minuman',
    name: 'Teh O Ais Limau',
    malay: 'Iced Lime Tea',
    desc: 'Black tea, calamansi and ice. The drink that cuts through a plate of kuey teow.',
    price: 3.5,
    spice: 0,
    tags: ['vegetarian', 'vegan'],
    pick: true,
    art: { vessel: 'glass', base: '#a2561f', toppings: ['ice', 'lime', 'straw'] }
  },
  {
    id: 'teh-tarik',
    cat: 'minuman',
    name: 'Teh Tarik',
    malay: 'Pulled Milk Tea',
    desc: 'Pulled between two jugs until it froths. Hot, unless you say ais.',
    price: 3.5,
    spice: 0,
    tags: ['vegetarian', 'dairy'],
    art: { vessel: 'glass', base: '#b07b4a', toppings: ['foam'] }
  },
  {
    id: 'kopi-o-ais',
    cat: 'minuman',
    name: 'Kopi O Ais',
    malay: 'Iced Black Coffee',
    desc: 'Dark local robusta through a sock filter, already sweetened, poured over ice.',
    price: 3.5,
    spice: 0,
    tags: ['vegetarian', 'vegan'],
    art: { vessel: 'glass', base: '#3b2417', toppings: ['ice', 'straw'] }
  },
  {
    id: 'milo-dinosaur',
    cat: 'minuman',
    name: 'Milo Dinosaur',
    malay: 'Iced Milo, Extra Powder',
    desc: 'Iced Milo with a heaped spoon of undissolved powder on top. Drink it before it sinks.',
    price: 6.0,
    spice: 0,
    tags: ['vegetarian', 'dairy'],
    art: { vessel: 'glass', base: '#5a3b24', toppings: ['powder', 'ice', 'straw'] }
  },
  {
    id: 'sirap-bandung',
    cat: 'minuman',
    name: 'Sirap Bandung',
    malay: 'Rose Milk',
    desc: 'Rose syrup and evaporated milk over ice. Add soda for 80 sen.',
    price: 4.5,
    spice: 0,
    tags: ['vegetarian', 'dairy'],
    art: { vessel: 'glass', base: '#e0748f', toppings: ['ice', 'straw'] }
  },
  {
    id: 'jus-tebu',
    cat: 'minuman',
    name: 'Jus Tebu',
    malay: 'Sugarcane Juice',
    desc: 'Pressed at the stall behind us, with calamansi squeezed in.',
    price: 5.5,
    spice: 0,
    tags: ['vegetarian', 'vegan'],
    art: { vessel: 'glass', base: '#c9c06a', toppings: ['ice', 'lime', 'straw'] }
  },
  {
    id: 'air-mata-kucing',
    cat: 'minuman',
    name: 'Air Mata Kucing',
    malay: 'Longan & Winter Melon',
    desc: 'Dried longan simmered with winter melon, served very cold.',
    price: 5.0,
    spice: 0,
    tags: ['vegetarian', 'vegan'],
    art: { vessel: 'glass', base: '#7a4a22', toppings: ['longan', 'ice', 'straw'] }
  },
  {
    id: 'barli-limau',
    cat: 'minuman',
    name: 'Barli Limau',
    malay: 'Barley with Lime',
    desc: 'Cooling barley water with lime, thick at the bottom of the glass.',
    price: 4.0,
    spice: 0,
    tags: ['vegetarian', 'vegan'],
    art: { vessel: 'glass', base: '#e5ddc4', toppings: ['barley', 'lime', 'ice'] }
  },
  {
    id: 'air-suam',
    cat: 'minuman',
    name: 'Air Suam',
    malay: 'Warm Plain Water',
    desc: 'Free with any plate, if you ask.',
    price: 0,
    spice: 0,
    tags: ['vegetarian', 'vegan'],
    art: { vessel: 'glass', base: '#cfe0e6', toppings: [] }
  }
];
