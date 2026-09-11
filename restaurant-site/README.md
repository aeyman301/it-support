# Rasa Warisan — Malaysian restaurant menu site

A static, no-build website for browsing a Malaysian restaurant menu: 70 dishes
across eight sections, with search, dietary and heat filters, a saved "My picks"
shortlist, a dark theme, and a Netlify-powered table booking form.

Everything is plain HTML, CSS and JavaScript — no framework, no build step, no
dependencies. Open `index.html` in a browser and it works.

```
restaurant-site/
├── index.html            the whole site: hero, menu, booking form, visit info
├── thanks.html           where the booking form lands after a submission
├── 404.html
├── robots.txt
└── assets/
    ├── css/styles.css    all styling, light + dark themes, print styles
    ├── img/favicon.svg
    └── js/
        ├── menu-data.js  ← the menu lives here. This is what you edit.
        └── app.js        rendering, search, filters, picks list, theme
```

## Editing the menu

Open `assets/js/menu-data.js`. Restaurant details (name, address, phone,
WhatsApp number, opening hours) are at the top; sections and dishes follow.
A dish looks like this:

```js
{
  id: 'char-kuey-teow',        // unique; used by the saved picks list
  cat: 'mee',                  // must match a category id
  name: 'Char Kuey Teow',
  malay: 'Penang Style',
  desc: 'Flat rice noodles over a roaring flame with prawns, cockles…',
  price: 13.0,                 // RM; add priceNote: 'from' for "from RM13.00"
  spice: 2,                    // 0 none · 1 mild · 2 medium · 3 fiery
  tags: ['seafood', 'shellfish', 'egg'],
  pick: true                   // shows the "Chef's pick" badge
}
```

Recognised tags: `vegetarian`, `vegan`, `nuts`, `shellfish`, `seasonal` show as
badges on the card; `seafood`, `beef`, `lamb`, `chicken`, `egg`, `dairy`,
`belacan` are searchable but not displayed. The "Vegetarian" and "No nuts"
filters read `vegetarian` and `nuts`.

Save the file and refresh — nothing to rebuild. To change the brand name and
colours, edit the `:root` custom properties at the top of `assets/css/styles.css`.

## Deploying to Netlify

`netlify.toml` at the repository root already points Netlify at this folder
(`publish = "restaurant-site"`, no build command), so both routes below work
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

### The booking form

The reservation form uses [Netlify Forms](https://docs.netlify.com/forms/setup/):
`data-netlify="true"` plus a hidden `form-name` field and a honeypot. Netlify
detects it at deploy time — nothing to configure in code. After deploying:

- Submissions appear under *Site configuration → Forms* in the Netlify dashboard.
- Turn on *Form notifications* to get an email (or Slack message) per booking.
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

- Fonts come from Google Fonts (Fraunces + Inter) with system fallbacks, so the
  site still reads well if the fonts are blocked or slow.
- The picks list and theme choice are stored in `localStorage` on the visitor's
  own device — no accounts, no tracking, no cookies.
- Rasa Warisan is a fictional restaurant. The dishes are real Malaysian ones and
  the prices sit in the normal range for a KL sit-down restaurant, but swap in
  your own details before using this for a real business.
