# PWA Icons

This directory should contain the following icon files for PWA support:

- `icon-72x72.png` - 72x72 pixels
- `icon-96x96.png` - 96x96 pixels
- `icon-128x128.png` - 128x128 pixels
- `icon-144x144.png` - 144x144 pixels
- `icon-152x152.png` - 152x152 pixels
- `icon-192x192.png` - 192x192 pixels (required)
- `icon-384x384.png` - 384x384 pixels
- `icon-512x512.png` - 512x512 pixels (required)

## Generating Icons

You can generate these icons from a single source image (recommended: 512x512 or larger) using:

1. **Online tools:**
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
   - https://favicon.io/

2. **Command line (ImageMagick):**
   ```bash
   convert source-icon.png -resize 72x72 icon-72x72.png
   convert source-icon.png -resize 96x96 icon-96x96.png
   convert source-icon.png -resize 128x128 icon-128x128.png
   convert source-icon.png -resize 144x144 icon-144x144.png
   convert source-icon.png -resize 152x152 icon-152x152.png
   convert source-icon.png -resize 192x192 icon-192x192.png
   convert source-icon.png -resize 384x384 icon-384x384.png
   convert source-icon.png -resize 512x512 icon-512x512.png
   ```

## Icon Requirements

- **Format:** PNG with transparency
- **Style:** Square icons work best
- **Design:** Should be recognizable at small sizes
- **Maskable:** Icons should work well as maskable icons (safe zone: 80% of icon area)

## Temporary Placeholder

Until proper icons are added, the app will use a default placeholder. Replace these with your actual app icons for production.
