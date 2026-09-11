# Char Kuey Teow Abang Chor — menu site

A static, no-build website for a Malaysian night stall: 36 dishes across six
sections, each with its own illustration, plus search, dietary and heat filters,
a saved "My picks" shortlist, a dark theme, and a Netlify-powered bungkus
(takeaway) order form.

The stall opens at 6pm, so there is no breakfast section — the menu starts at
char kuey teow and works outwards.

Everything is plain HTML, CSS and JavaScript — no framework, no build step, no
dependencies. Open `index.html` in a browser and it works.

```
restaurant-site/
├── index.html            the whole site: hero, menu, order form, find-us
├── thanks.html           where the order form lands after a submission
├── 404.html
├── robots.txt
└── assets/
    ├── css/styles.css    all styling, light + dark themes, print styles
    ├── img/favicon.svg
    └── js/
        ├── menu-data.js  ← the menu lives here. This is what you edit.
        ├── dish-art.js   draws the dish illustrations
        └── app.js        rendering, search, filters, picks list, theme
```

## Editing the menu

Open `assets/js/menu-data.js`. Stall details (name, address, phone, WhatsApp
number, opening hours) are at the top; sections and dishes follow. A dish looks
like this:

```js
{
  id: 'ckt-telur-itik',          // unique; used by the saved picks list
  cat: 'ckt',                    // must match a category id
  name: 'Char Kuey Teow Telur Itik',
  malay: 'with Duck Egg',
  desc: 'The standard plate with a duck egg cracked in at the end…',
  price: 12.0,                   // RM; add priceNote: 'from' for "from RM12.00"
  spice: 1,                      // 0 none · 1 mild · 2 medium · 3 fiery
  tags: ['seafood', 'shellfish', 'egg'],
  pick: true,                    // shows the "Abang's pick" badge
  art: {                         // the illustration — see below
    vessel: 'plate',
    base: '#6d3f22',
    toppings: ['eggyolk', 'prawn', 'cockle', 'chive', 'taugeh']
  }
}
```

Recognised tags: `vegetarian`, `vegan`, `nuts`, `shellfish`, `seasonal` show as
badges on the card; `seafood`, `chicken`, `egg`, `dairy` are searchable but not
displayed. The "Vegetarian" and "No shellfish" filters read `vegetarian` and
`shellfish`. A price of `0` displays as "Free".

Save the file and refresh — nothing to rebuild.

## The dish illustrations

There are no photographs. Each dish is drawn as an SVG by
`assets/js/dish-art.js` from the `art` block above, so a new dish gets a picture
the moment you describe it. Placement is randomised but seeded from the dish id,
so a dish looks the same on every visit while no two plates look alike.

- `vessel` — `plate`, `bowl`, `dessert` or `glass`
- `base` — hex colour of the noodles, rice, broth or drink (`null` for a dish
  with no base layer, like a fried egg). Noodle shape is inferred from the dish:
  flat for kuey teow, thin for bihun, grains for nasi, and so on
- `toppings` — any of: `prawn`, `prawnbig`, `cockle`, `egg`, `eggyolk`,
  `friedegg`, `chive`, `taugeh`, `chilli`, `tofu`, `greens`, `squidring`,
  `chicken`, `anchovy`, `oyster`, `lekor`, `omelette`, `banana`, `cheese`,
  `lime`, `gravy`, `steam`, `icemound`, `cendolworm`, `redbean`, `corn`, `sago`,
  `syrup`, `cream`, `ice`, `straw`, `foam`, `powder`, `longan`, `barley`

To add a garnish of your own, add a function to the `TOPPINGS` map in
`dish-art.js`. Plate and background colours come from CSS custom properties, so
the art follows the light and dark themes; the food keeps its own colours.

To change the brand colours or fonts, edit the `:root` custom properties at the
top of `assets/css/styles.css`.

## Deploying to Netlify

`netlify.toml` at the repository root already points Netlify at this folder
(`publish = "restaurant-site"`, no build command), so all three routes work
without any extra configuration.

**Connect the repository (recommended — redeploys on every push)**

1. Netlify → *Add new site* → *Import an existing project* → GitHub → pick this repo.
2. Leave build command empty and publish directory as `restaurant-site`; the
   values come from `netlify.toml` anyway.
3. Deploy. Later pushes to the same branch redeploy automatically.

**Or drag and drop (fastest, no repo connection)**

Drag the `restaurant-site` folder onto https://app.netlify.com/drop.

**Or the CLI**

```bash
npm install -g netlify-cli
netlify deploy --dir=restaurant-site --prod
```

### The bungkus form

The order form uses [Netlify Forms](https://docs.netlify.com/forms/setup/):
`data-netlify="true"` plus a hidden `form-name` field and a honeypot. Netlify
detects it at deploy time — nothing to configure in code. After deploying:

- Submissions appear under *Site configuration → Forms* in the Netlify dashboard.
- Turn on *Form notifications* to get an email (or Slack message) per order.
- Successful submissions redirect to `/thanks.html`.
- Netlify's free tier includes 100 submissions a month.

If submissions do not appear, check that form detection is enabled for the site
(*Site configuration → Forms → Form detection*) and redeploy.

### Custom domain

*Domain management → Add a domain* in Netlify. HTTPS is provisioned automatically
via Let's Encrypt once DNS points at Netlify.

## Working on it locally

Any static server works; the site also opens fine straight from the filesystem.

```bash
cd restaurant-site
python3 -m http.server 8000    # then open http://localhost:8000
```

## Notes

- Fonts come from Google Fonts (Bricolage Grotesque + Archivo) with system
  fallbacks, so the site still reads well if the fonts are blocked or slow.
- The picks list and theme choice are stored in `localStorage` on the visitor's
  own device — no accounts, no tracking, no cookies.
- Char Kuey Teow Abang Chor is a fictional stall. The dishes are real Malaysian
  ones and the prices sit in the normal range for a night stall, but swap in your
  own details before using this for a real business.
