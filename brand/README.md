# Brand assets

Source artwork for the app icons. **Not published** — Vite only serves
`public/`, so nothing here ends up in the deployed bundle.

## Adding the logo

Drop the file here as `logo.<ext>`. The first match wins:

```
logo.svg   logo.png   logo.jpg   logo.jpeg   logo.webp
```

Then regenerate the icon set:

```bash
node scripts/generate-icons.mjs
```

That writes every size the manifest and iOS need into `public/icons/`.
Commit those PNGs — the build does not regenerate them.

## Requirements for a good result

- **Square** artwork. Non-square logos are letterboxed, not cropped, so a
  wide logo ends up small inside the icon.
- **At least 512×512** for raster files. SVG is preferred: it is rasterised at
  high density, so every size stays sharp.
- **Transparent background** (PNG/SVG). The script fills the canvas itself.

## Background colour

The canvas behind the logo defaults to the brand blue `#1867c0`. A logo that
is itself dark or blue will disappear against it — override the colour:

```bash
ICON_BG=#ffffff node scripts/generate-icons.mjs
```

Icons cannot be transparent: Android launchers and iOS composite them onto
surfaces the app does not control, so a solid canvas is mandatory.

## No logo committed?

The script falls back to a `PE` lettermark, so a fresh clone still builds.
