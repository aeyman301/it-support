/*
 * Menu data for Rasa Warisan.
 *
 * This is the only file you need to edit to change the menu — index.html
 * renders everything from here. Prices are in Malaysian Ringgit (RM).
 *
 * Item fields:
 *   id     unique slug, used for the "My Picks" list saved in the browser
 *   cat    category id, must match one of the categories below
 *   name   English / common name
 *   malay  Malay (or Hokkien/Tamil) name shown under the English one
 *   desc   one or two lines describing the dish
 *   price  number, in RM. Use `priceNote` for "from RM14" style pricing
 *   spice  0 = not spicy, 1 = mild, 2 = medium, 3 = fiery
 *   tags   any of: vegetarian, vegan, seafood, nuts, beef, lamb, chicken,
 *          egg, dairy, shellfish, belacan, seasonal
 *   pick   true to show the "Chef's pick" badge
 */

const RESTAURANT = {
  name: 'Rasa Warisan',
  tagline: 'Heritage Malaysian kitchen',
  blurb:
    'Kampung recipes, mamak favourites and Nyonya classics — cooked over ' +
    'charcoal and served all day. Halal-certified kitchen.',
  address: '17 Jalan Setia Murni, Bukit Damansara, 50490 Kuala Lumpur',
  phone: '+60 3-2011 8877',
  whatsapp: '60320118877',
  email: 'makan@rasawarisan.example',
  hours: [
    { days: 'Monday – Thursday', time: '8:00am – 11:00pm' },
    { days: 'Friday – Saturday', time: '8:00am – 1:00am' },
    { days: 'Sunday', time: '8:00am – 10:00pm' }
  ]
};

const CATEGORIES = [
  {
    id: 'roti',
    name: 'Roti & Breakfast',
    malay: 'Sarapan',
    icon: 'icon-roti',
    blurb: 'Griddled on the tawa from 8am. Served with dhal and fish curry.'
  },
  {
    id: 'nasi',
    name: 'Rice Plates',
    malay: 'Nasi',
    icon: 'icon-rice',
    blurb: 'Banana-leaf portions, nasi kandar gravies and northern classics.'
  },
  {
    id: 'mee',
    name: 'Noodles & Laksa',
    malay: 'Mee & Laksa',
    icon: 'icon-noodles',
    blurb: 'Wok-fried over a hard flame, or ladled from the laksa pot.'
  },
  {
    id: 'dapur',
    name: 'From the Kitchen',
    malay: 'Masakan Kampung',
    icon: 'icon-wok',
    blurb: 'Sharing dishes for the table. Order two or three with rice.'
  },
  {
    id: 'bakar',
    name: 'Satay & Charcoal Grill',
    malay: 'Satay & Bakar',
    icon: 'icon-satay',
    blurb: 'Fanned over coconut husk charcoal from 5pm daily.'
  },
  {
    id: 'sampingan',
    name: 'Soups & Sides',
    malay: 'Sup & Sampingan',
    icon: 'icon-soup',
    blurb: 'Small plates, ulam and the things that make a meal a meal.'
  },
  {
    id: 'manis',
    name: 'Desserts',
    malay: 'Manis',
    icon: 'icon-dessert',
    blurb: 'Shaved ice, coconut milk and gula melaka from Melaka.'
  },
  {
    id: 'minuman',
    name: 'Drinks',
    malay: 'Minuman',
    icon: 'icon-drink',
    blurb: 'Pulled tea, kopi from a sock filter, and iced everything.'
  }
];

const ITEMS = [
  /* ---------------------------------------------------------- Roti ---- */
  {
    id: 'roti-canai',
    cat: 'roti',
    name: 'Roti Canai',
    malay: 'Roti Kosong',
    desc: 'Flaky, hand-slapped flatbread, crisp outside and chewy within. Comes with dhal and a bowl of fish curry.',
    price: 2.5,
    spice: 0,
    tags: ['vegetarian'],
    pick: true
  },
  {
    id: 'roti-telur',
    cat: 'roti',
    name: 'Roti Telur',
    malay: 'Egg Roti',
    desc: 'Roti canai folded around a beaten egg and chopped onion.',
    price: 4.0,
    spice: 0,
    tags: ['vegetarian', 'egg']
  },
  {
    id: 'roti-bawang',
    cat: 'roti',
    name: 'Roti Bawang',
    malay: 'Onion Roti',
    desc: 'Sweet onion, green chilli and coriander pressed into the dough.',
    price: 4.0,
    spice: 1,
    tags: ['vegetarian']
  },
  {
    id: 'roti-sardin',
    cat: 'roti',
    name: 'Roti Sardin',
    malay: 'Sardine Roti',
    desc: 'Sardines simmered with onion and chilli, sealed inside the roti.',
    price: 5.5,
    spice: 2,
    tags: ['seafood']
  },
  {
    id: 'roti-tisu',
    cat: 'roti',
    name: 'Roti Tisu',
    malay: 'Tissue Roti',
    desc: 'A metre-tall cone of paper-thin roti, brushed with margarine and dusted with sugar.',
    price: 7.0,
    spice: 0,
    tags: ['vegetarian', 'dairy'],
    pick: true
  },
  {
    id: 'murtabak-ayam',
    cat: 'roti',
    name: 'Murtabak Ayam',
    malay: 'Chicken Murtabak',
    desc: 'Stuffed with minced chicken, egg and onion, cut into squares and served with pickled onion.',
    price: 9.5,
    spice: 1,
    tags: ['chicken', 'egg']
  },
  {
    id: 'murtabak-daging',
    cat: 'roti',
    name: 'Murtabak Daging',
    malay: 'Beef Murtabak',
    desc: 'The same, made with spiced minced beef and a heavier hand on the garam masala.',
    price: 11.0,
    spice: 2,
    tags: ['beef', 'egg']
  },
  {
    id: 'thosai-masala',
    cat: 'roti',
    name: 'Thosai Masala',
    malay: 'Tosai Masala',
    desc: 'Fermented rice crepe wrapped around turmeric potato, with coconut chutney and sambar.',
    price: 7.0,
    spice: 1,
    tags: ['vegetarian', 'vegan']
  },
  {
    id: 'nasi-lemak-biasa',
    cat: 'roti',
    name: 'Nasi Lemak Biasa',
    malay: 'Classic Coconut Rice',
    desc: 'Coconut rice steamed with pandan, sambal tumis, fried anchovies, peanuts, cucumber and half a boiled egg.',
    price: 4.5,
    spice: 2,
    tags: ['nuts', 'seafood', 'egg'],
    pick: true
  },
  {
    id: 'nasi-lemak-ayam',
    cat: 'roti',
    name: 'Nasi Lemak Ayam Berempah',
    malay: 'with Spiced Fried Chicken',
    desc: 'The full plate, with a thigh marinated in turmeric, lemongrass and chilli, then fried in its own spice crumb.',
    price: 13.5,
    spice: 2,
    tags: ['chicken', 'nuts', 'egg']
  },
  {
    id: 'lontong',
    cat: 'roti',
    name: 'Lontong',
    malay: 'Sayur Lodeh',
    desc: 'Compressed rice cakes in a coconut vegetable curry, with sambal, tempeh and serunding.',
    price: 9.0,
    spice: 1,
    tags: ['vegetarian']
  },

  /* ---------------------------------------------------------- Nasi ---- */
  {
    id: 'nasi-kandar',
    cat: 'nasi',
    name: 'Nasi Kandar Campur',
    malay: 'Mixed Rice, Penang Style',
    desc: 'Pick your dishes at the counter; we flood the rice with kuah campur — every curry in the house, mixed.',
    price: 14.0,
    priceNote: 'from',
    spice: 3,
    tags: [],
    pick: true
  },
  {
    id: 'briyani-ayam',
    cat: 'nasi',
    name: 'Nasi Briyani Ayam',
    malay: 'Chicken Briyani',
    desc: 'Basmati cooked in chicken stock and ghee, with a quarter chicken masala, raita and acar.',
    price: 15.0,
    spice: 2,
    tags: ['chicken', 'dairy']
  },
  {
    id: 'briyani-kambing',
    cat: 'nasi',
    name: 'Nasi Briyani Kambing',
    malay: 'Mutton Briyani',
    desc: 'Slow-braised mutton shank, dum-cooked under the rice so the fat renders into it.',
    price: 22.0,
    spice: 2,
    tags: ['lamb', 'dairy']
  },
  {
    id: 'nasi-goreng-kampung',
    cat: 'nasi',
    name: 'Nasi Goreng Kampung',
    malay: 'Village Fried Rice',
    desc: 'Fried with anchovies, kangkung and plenty of bird’s eye chilli. Comes with a fried egg.',
    price: 10.5,
    spice: 3,
    tags: ['seafood', 'egg'],
    pick: true
  },
  {
    id: 'nasi-goreng-pattaya',
    cat: 'nasi',
    name: 'Nasi Goreng Pattaya',
    malay: 'Omelette-wrapped Fried Rice',
    desc: 'Chicken fried rice parcelled inside a thin omelette, finished with chilli sauce.',
    price: 12.0,
    spice: 1,
    tags: ['chicken', 'egg']
  },
  {
    id: 'nasi-ayam',
    cat: 'nasi',
    name: 'Nasi Ayam Hainan',
    malay: 'Hainanese Chicken Rice',
    desc: 'Poached or roast chicken, rice cooked in the poaching stock, with ginger paste and chilli-lime sauce.',
    price: 12.5,
    spice: 1,
    tags: ['chicken']
  },
  {
    id: 'nasi-kerabu',
    cat: 'nasi',
    name: 'Nasi Kerabu Ayam Percik',
    malay: 'Blue Rice, Kelantan Style',
    desc: 'Rice tinted with butterfly pea flower, tossed with herbs and grated coconut, with grilled percik chicken.',
    price: 15.0,
    spice: 2,
    tags: ['chicken', 'belacan'],
    pick: true
  },
  {
    id: 'nasi-dagang',
    cat: 'nasi',
    name: 'Nasi Dagang Ikan Tongkol',
    malay: 'Terengganu Rice',
    desc: 'Nutty half-milled rice steamed with coconut and fenugreek, with tuna gulai and acar.',
    price: 14.0,
    spice: 2,
    tags: ['seafood']
  },

  /* ----------------------------------------------------------- Mee ---- */
  {
    id: 'mee-goreng-mamak',
    cat: 'mee',
    name: 'Mee Goreng Mamak',
    malay: 'Mamak Fried Noodles',
    desc: 'Yellow noodles wok-fried with potato, tofu, tomato sauce and chilli paste. Sweet, sour and smoky.',
    price: 9.5,
    spice: 2,
    tags: ['egg'],
    pick: true
  },
  {
    id: 'maggi-goreng',
    cat: 'mee',
    name: 'Maggi Goreng',
    malay: 'Fried Instant Noodles',
    desc: 'The late-night order. Instant noodles fried mamak-style with egg, cabbage and fried chicken pieces.',
    price: 9.0,
    spice: 2,
    tags: ['chicken', 'egg']
  },
  {
    id: 'char-kuey-teow',
    cat: 'mee',
    name: 'Char Kuey Teow',
    malay: 'Penang Style',
    desc: 'Flat rice noodles over a roaring flame with prawns, cockles, chives and bean sprouts. Ask for extra wok hei.',
    price: 13.0,
    spice: 2,
    tags: ['seafood', 'shellfish', 'egg'],
    pick: true
  },
  {
    id: 'hokkien-mee',
    cat: 'mee',
    name: 'KL Hokkien Mee',
    malay: 'Mee Hailam Hitam',
    desc: 'Thick noodles braised in dark soy with pork-free stock, cabbage and crisped lard-free crackling.',
    price: 13.5,
    spice: 0,
    tags: ['seafood']
  },
  {
    id: 'laksa-penang',
    cat: 'mee',
    name: 'Asam Laksa',
    malay: 'Laksa Penang',
    desc: 'Sour mackerel broth with tamarind, torch ginger and mint, over thick rice noodles. Prawn paste on the side.',
    price: 12.0,
    spice: 2,
    tags: ['seafood', 'belacan']
  },
  {
    id: 'curry-laksa',
    cat: 'mee',
    name: 'Curry Laksa',
    malay: 'Curry Mee',
    desc: 'Coconut curry broth with bean curd puffs, cockles, prawns, long beans and both noodles.',
    price: 13.0,
    spice: 2,
    tags: ['seafood', 'shellfish']
  },
  {
    id: 'laksa-sarawak',
    cat: 'mee',
    name: 'Sarawak Laksa',
    malay: 'Laksa Sarawak',
    desc: 'Sambal belacan and coconut broth with shredded omelette, prawns and chicken over bihun. Lime on the side.',
    price: 14.0,
    spice: 2,
    tags: ['seafood', 'chicken', 'egg', 'belacan']
  },
  {
    id: 'mee-rebus',
    cat: 'mee',
    name: 'Mee Rebus',
    malay: 'Noodles in Sweet Potato Gravy',
    desc: 'Yellow noodles under a thick, gently sweet gravy, with boiled egg, tofu and green chilli.',
    price: 9.5,
    spice: 1,
    tags: ['egg', 'seafood']
  },
  {
    id: 'wantan-mee',
    cat: 'mee',
    name: 'Wantan Mee',
    malay: 'Dry Egg Noodles',
    desc: 'Springy egg noodles tossed in dark soy and sesame with chicken char siu and dumplings in clear soup.',
    price: 10.0,
    spice: 0,
    tags: ['chicken', 'egg']
  },
  {
    id: 'bihun-sup',
    cat: 'mee',
    name: 'Bihun Sup Utara',
    malay: 'Northern Beef Noodle Soup',
    desc: 'Rice vermicelli in a clear, long-simmered beef and spice broth, with fried shallots and sambal kicap.',
    price: 11.0,
    spice: 1,
    tags: ['beef']
  },

  /* --------------------------------------------------------- Dapur ---- */
  {
    id: 'rendang-tok',
    cat: 'dapur',
    name: 'Rendang Daging Tok',
    malay: 'Perak Dry Beef Rendang',
    desc: 'Beef short rib cooked down for five hours in coconut milk and kerisik until dark and almost dry.',
    price: 24.0,
    spice: 2,
    tags: ['beef'],
    pick: true
  },
  {
    id: 'ayam-masak-merah',
    cat: 'dapur',
    name: 'Ayam Masak Merah',
    malay: 'Chicken in Red Gravy',
    desc: 'Fried chicken simmered in a tomato-chilli gravy sweetened with a little coconut milk.',
    price: 18.0,
    spice: 2,
    tags: ['chicken']
  },
  {
    id: 'ikan-bakar',
    cat: 'dapur',
    name: 'Ikan Pari Bakar',
    malay: 'Grilled Stingray',
    desc: 'Stingray wing smothered in sambal, wrapped in banana leaf and grilled over charcoal. With calamansi.',
    price: 28.0,
    spice: 3,
    tags: ['seafood', 'belacan'],
    pick: true
  },
  {
    id: 'udang-lemak',
    cat: 'dapur',
    name: 'Udang Masak Lemak Cili Api',
    malay: 'Prawns in Turmeric Coconut Curry',
    desc: 'Negeri Sembilan style: tiger prawns in a bright yellow coconut gravy with a real bird’s eye chilli kick.',
    price: 29.0,
    spice: 3,
    tags: ['seafood', 'shellfish']
  },
  {
    id: 'sambal-petai',
    cat: 'dapur',
    name: 'Sambal Petai Udang',
    malay: 'Stink Beans with Prawns',
    desc: 'Petai beans and prawns in a caramelised sambal tumis. Pungent, and the reason people come back.',
    price: 24.0,
    spice: 3,
    tags: ['seafood', 'shellfish', 'belacan']
  },
  {
    id: 'kari-kepala-ikan',
    cat: 'dapur',
    name: 'Kari Kepala Ikan',
    malay: 'Fish Head Curry',
    desc: 'A whole red snapper head in tamarind curry with okra, brinjal and tomato. Serves three to four.',
    price: 48.0,
    spice: 2,
    tags: ['seafood']
  },
  {
    id: 'daging-kicap',
    cat: 'dapur',
    name: 'Daging Masak Hitam',
    malay: 'Beef in Dark Soy',
    desc: 'Beef braised in caramelised dark soy with star anise, cinnamon and a lot of shallots.',
    price: 21.0,
    spice: 1,
    tags: ['beef']
  },
  {
    id: 'sotong-goreng',
    cat: 'dapur',
    name: 'Sotong Goreng Tepung',
    malay: 'Salted Egg Squid',
    desc: 'Squid rings in a light batter, tossed in salted egg yolk with curry leaf and chilli padi.',
    price: 19.0,
    spice: 2,
    tags: ['seafood', 'egg']
  },
  {
    id: 'kangkung-belacan',
    cat: 'dapur',
    name: 'Kangkung Belacan',
    malay: 'Water Spinach with Shrimp Paste',
    desc: 'Water spinach flash-fried with toasted shrimp paste, garlic and chilli.',
    price: 12.0,
    spice: 2,
    tags: ['belacan', 'seafood']
  },
  {
    id: 'terung-masak-lemak',
    cat: 'dapur',
    name: 'Terung Masak Lemak',
    malay: 'Brinjal in Coconut Curry',
    desc: 'Brinjal and long beans in turmeric coconut gravy. Made without belacan — fully vegetarian.',
    price: 13.0,
    spice: 2,
    tags: ['vegetarian', 'vegan']
  },

  /* --------------------------------------------------------- Bakar ---- */
  {
    id: 'satay-ayam',
    cat: 'bakar',
    name: 'Satay Ayam',
    malay: 'Chicken Satay, 10 sticks',
    desc: 'Turmeric-marinated chicken thigh over charcoal, basted with lemongrass. Peanut sauce, ketupat, onion, cucumber.',
    price: 15.0,
    spice: 1,
    tags: ['chicken', 'nuts'],
    pick: true
  },
  {
    id: 'satay-daging',
    cat: 'bakar',
    name: 'Satay Daging',
    malay: 'Beef Satay, 10 sticks',
    desc: 'Beef rump, cut against the grain and grilled just past pink.',
    price: 17.0,
    spice: 1,
    tags: ['beef', 'nuts']
  },
  {
    id: 'satay-kambing',
    cat: 'bakar',
    name: 'Satay Kambing',
    malay: 'Mutton Satay, 10 sticks',
    desc: 'Mutton marinated overnight in coriander and cumin. Richer, and worth the extra.',
    price: 21.0,
    spice: 1,
    tags: ['lamb', 'nuts']
  },
  {
    id: 'ayam-percik',
    cat: 'bakar',
    name: 'Ayam Percik',
    malay: 'Grilled Coconut Chicken',
    desc: 'Half a chicken grilled slowly while a spiced coconut gravy is spooned over it, again and again.',
    price: 20.0,
    spice: 2,
    tags: ['chicken']
  },
  {
    id: 'ayam-goreng-berempah',
    cat: 'bakar',
    name: 'Ayam Goreng Berempah',
    malay: 'Spiced Fried Chicken, 2 pieces',
    desc: 'Marinated in turmeric, galangal and lemongrass, fried with the spice paste clinging to the skin.',
    price: 13.0,
    spice: 2,
    tags: ['chicken']
  },
  {
    id: 'ikan-keli-bakar',
    cat: 'bakar',
    name: 'Ikan Keli Bakar',
    malay: 'Grilled Catfish',
    desc: 'Whole catfish charred over coals, with air asam — a sharp tamarind, chilli and shallot dip.',
    price: 22.0,
    spice: 3,
    tags: ['seafood']
  },

  /* ---------------------------------------------------- Sampingan ---- */
  {
    id: 'sup-tulang',
    cat: 'sampingan',
    name: 'Sup Tulang',
    malay: 'Beef Bone Soup',
    desc: 'Marrow bones in a peppery spice broth with fried shallots, coriander and a slice of lime.',
    price: 18.0,
    spice: 1,
    tags: ['beef']
  },
  {
    id: 'sup-ayam',
    cat: 'sampingan',
    name: 'Sup Ayam Rempah',
    malay: 'Spiced Chicken Soup',
    desc: 'Clear chicken soup with cardamom, star anise and celery. What everyone orders when it rains.',
    price: 12.0,
    spice: 0,
    tags: ['chicken']
  },
  {
    id: 'kerabu-mangga',
    cat: 'sampingan',
    name: 'Kerabu Mangga',
    malay: 'Green Mango Salad',
    desc: 'Shredded unripe mango with shallot, chilli, toasted coconut and dried shrimp, dressed in lime.',
    price: 10.0,
    spice: 2,
    tags: ['seafood', 'belacan']
  },
  {
    id: 'ulam',
    cat: 'sampingan',
    name: 'Ulam & Sambal Belacan',
    malay: 'Raw Herb Platter',
    desc: 'Pegaga, ulam raja, cucumber and four-angled bean, with pounded chilli and shrimp paste.',
    price: 9.0,
    spice: 3,
    tags: ['belacan', 'seafood']
  },
  {
    id: 'acar-buah',
    cat: 'sampingan',
    name: 'Acar Buah',
    malay: 'Nyonya Pickles',
    desc: 'Cucumber, carrot, pineapple and cabbage pickled with sesame and crushed peanut.',
    price: 8.0,
    spice: 1,
    tags: ['vegetarian', 'vegan', 'nuts']
  },
  {
    id: 'telur-dadar',
    cat: 'sampingan',
    name: 'Telur Dadar',
    malay: 'Malay Omelette',
    desc: 'Thick omelette with shallot, spring onion and chilli, fried until the edges frill and crisp.',
    price: 8.0,
    spice: 1,
    tags: ['vegetarian', 'egg']
  },
  {
    id: 'papadom',
    cat: 'sampingan',
    name: 'Papadom',
    malay: 'Lentil Crackers, 3 pieces',
    desc: 'Fried to order, so they arrive still puffing.',
    price: 3.0,
    spice: 0,
    tags: ['vegetarian', 'vegan']
  },
  {
    id: 'nasi-putih',
    cat: 'sampingan',
    name: 'Nasi Putih',
    malay: 'Steamed White Rice',
    desc: 'A bowl of jasmine rice, for the sharing dishes.',
    price: 2.5,
    spice: 0,
    tags: ['vegetarian', 'vegan']
  },

  /* -------------------------------------------------------- Manis ---- */
  {
    id: 'cendol',
    cat: 'manis',
    name: 'Cendol Pulut',
    malay: 'Pandan Noodles & Gula Melaka',
    desc: 'Shaved ice, coconut milk, green pandan jellies and palm sugar, over a spoonful of glutinous rice.',
    price: 8.0,
    spice: 0,
    tags: ['vegetarian', 'vegan'],
    pick: true
  },
  {
    id: 'abc',
    cat: 'manis',
    name: 'Ais Kacang',
    malay: 'ABC',
    desc: 'A mountain of shaved ice over red bean, sweetcorn, grass jelly and attap seed, with rose syrup.',
    price: 8.5,
    spice: 0,
    tags: ['vegetarian', 'nuts', 'dairy']
  },
  {
    id: 'bubur-cha-cha',
    cat: 'manis',
    name: 'Bubur Cha Cha',
    malay: 'Sweet Potato in Coconut Milk',
    desc: 'Sweet potato, yam and sago pearls in warm pandan coconut milk. Served hot or iced.',
    price: 7.5,
    spice: 0,
    tags: ['vegetarian', 'vegan']
  },
  {
    id: 'sago-gula-melaka',
    cat: 'manis',
    name: 'Sago Gula Melaka',
    malay: 'Sago with Palm Sugar',
    desc: 'Chilled sago pearls, thick coconut cream and dark palm sugar poured at the table.',
    price: 7.5,
    spice: 0,
    tags: ['vegetarian', 'vegan']
  },
  {
    id: 'kuih-platter',
    cat: 'manis',
    name: 'Kuih Platter',
    malay: 'Assorted Kuih, 4 pieces',
    desc: 'Whatever the kitchen steamed that morning — seri muka, onde-onde, kuih lapis, talam.',
    price: 9.0,
    spice: 0,
    tags: ['vegetarian']
  },
  {
    id: 'pisang-goreng',
    cat: 'manis',
    name: 'Pisang Goreng Cheese',
    malay: 'Fried Banana with Cheese',
    desc: 'Banana fritters, still hot, with grated cheddar and a drizzle of condensed milk.',
    price: 8.0,
    spice: 0,
    tags: ['vegetarian', 'dairy']
  },
  {
    id: 'durian-cendol',
    cat: 'manis',
    name: 'Durian Cendol',
    malay: 'Seasonal',
    desc: 'Our cendol with a scoop of D24 durian folded through it. June to August, while the season holds.',
    price: 13.0,
    spice: 0,
    tags: ['vegetarian', 'seasonal']
  },

  /* ------------------------------------------------------ Minuman ---- */
  {
    id: 'teh-tarik',
    cat: 'minuman',
    name: 'Teh Tarik',
    malay: 'Pulled Milk Tea',
    desc: 'Strong black tea and condensed milk, pulled between two jugs until it foams.',
    price: 3.5,
    spice: 0,
    tags: ['vegetarian', 'dairy'],
    pick: true
  },
  {
    id: 'kopi-o-ais',
    cat: 'minuman',
    name: 'Kopi O Ais',
    malay: 'Iced Black Coffee',
    desc: 'Dark, caramelised local robusta brewed through a cloth sock filter. Sugar already in it.',
    price: 3.8,
    spice: 0,
    tags: ['vegetarian', 'vegan']
  },
  {
    id: 'milo-dinosaur',
    cat: 'minuman',
    name: 'Milo Dinosaur',
    malay: 'Iced Milo, Extra Powder',
    desc: 'Iced Milo with a heaped spoon of undissolved Milo powder on top.',
    price: 6.5,
    spice: 0,
    tags: ['vegetarian', 'dairy']
  },
  {
    id: 'sirap-bandung',
    cat: 'minuman',
    name: 'Sirap Bandung',
    malay: 'Rose Milk',
    desc: 'Rose syrup with evaporated milk, poured over ice. Add soda for 80 sen.',
    price: 4.5,
    spice: 0,
    tags: ['vegetarian', 'dairy']
  },
  {
    id: 'limau-ais',
    cat: 'minuman',
    name: 'Limau Ais',
    malay: 'Iced Calamansi',
    desc: 'Fresh calamansi over ice, with a little sour plum if you want it.',
    price: 4.0,
    spice: 0,
    tags: ['vegetarian', 'vegan']
  },
  {
    id: 'teh-o-limau',
    cat: 'minuman',
    name: 'Teh O Ais Limau',
    malay: 'Iced Lime Tea',
    desc: 'Black tea, lime and ice. The drink that cuts through a plate of nasi kandar.',
    price: 4.0,
    spice: 0,
    tags: ['vegetarian', 'vegan']
  },
  {
    id: 'air-kelapa',
    cat: 'minuman',
    name: 'Air Kelapa',
    malay: 'Young Coconut',
    desc: 'A whole young coconut, opened at the table. Ask for a spoon for the flesh.',
    price: 8.0,
    spice: 0,
    tags: ['vegetarian', 'vegan']
  },
  {
    id: 'jus-tebu',
    cat: 'minuman',
    name: 'Jus Tebu',
    malay: 'Sugarcane Juice',
    desc: 'Pressed to order, with calamansi squeezed in.',
    price: 6.0,
    spice: 0,
    tags: ['vegetarian', 'vegan']
  },
  {
    id: 'air-mata-kucing',
    cat: 'minuman',
    name: 'Air Mata Kucing',
    malay: 'Longan & Winter Melon',
    desc: 'Dried longan simmered with winter melon and monk fruit, served very cold.',
    price: 5.0,
    spice: 0,
    tags: ['vegetarian', 'vegan']
  },
  {
    id: 'barli-limau',
    cat: 'minuman',
    name: 'Barli Limau',
    malay: 'Barley with Lime',
    desc: 'Cooling barley water with lime. Hot or iced.',
    price: 4.5,
    spice: 0,
    tags: ['vegetarian', 'vegan']
  }
];
