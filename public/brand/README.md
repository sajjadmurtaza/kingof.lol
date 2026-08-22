# KINGOF brand assets

Two source files — edit SVGs, export PNGs for social platforms.

## Quick start

```bash
npm run brand:export
```

| Source (`svg/`)   | Export (`png/`)   | Size      | Use                                        |
| ----------------- | ----------------- | --------- | ------------------------------------------ |
| `cover.svg`       | `cover.png`       | 1200×630  | Wide banner — LinkedIn cover, X header, OG |
| `logo-square.svg` | `logo-square.png` | 1080×1080 | Square logo — profile pics, LinkedIn logo  |

Crop or resize in the platform UI if a site asks for a different dimension (e.g. LinkedIn logo 300×300).

---

## Brand colors

| Name       | Hex       | Use                  |
| ---------- | --------- | -------------------- |
| Gold       | `#fbbf24` | Crown, logo, accents |
| Gold light | `#fde68a` | Gradients            |
| Gold dark  | `#d97706` | Gradients            |
| Background | `#0a0a0a` | Dark social cards    |
| Text       | `#eeedf0` | Primary copy         |
| Muted      | `#a3a3a3` | Taglines             |
| Domain     | `#525252` | `kingof.lol` footer  |

**Tagline:** Products Compete for the Crown

---

## Site assets (separate from this folder)

| Path                          | Purpose                        |
| ----------------------------- | ------------------------------ |
| `public/icon.svg`             | Browser favicon / PWA          |
| `src/app/opengraph-image.tsx` | Dynamic OG image at build time |

---

## Editing

1. Edit `svg/cover.svg` or `svg/logo-square.svg`.
2. Run `npm run brand:export`.
3. Upload the matching PNG from `png/`.
