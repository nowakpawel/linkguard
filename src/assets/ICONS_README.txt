LINKGUARD EXTENSION ICONS
=========================

The extension requires 3 icon sizes:
- icon16.png (16x16) - Toolbar icon
- icon48.png (48x48) - Extension management
- icon128.png (128x128) - Chrome Web Store

TEMPORARY SOLUTION:
------------------
For now, the extension will work without icons (Chrome will show a default placeholder).

TO CREATE ICONS:
----------------

Option 1: Use your existing SVG assets
- You have favicon.svg in linkguard-helpers/assets/
- Convert it to PNG at different sizes
- Place in src/assets/

Option 2: Online tool
- Go to: https://www.favicon-generator.org/
- Upload an image
- Download all sizes
- Rename to icon16.png, icon48.png, icon128.png

Option 3: Design custom icons
- Use Figma, Canva, or any design tool
- Create a shield/lock symbol with "LG" text
- Export at required sizes
- Save as PNG

ICON GUIDELINES:
---------------
- Simple, recognizable design
- Works well at small sizes (16x16)
- Matches LinkGuard branding
- Blue/green color scheme (security/trust)
- Transparent background recommended

Once you have the icons:
1. Save them in: src/assets/
2. They'll automatically load (already configured in manifest.json)

For MVP launch, you can:
- Use simple colored squares as placeholders
- Design proper icons later
- Chrome Web Store doesn't require custom icons to test

PRIORITY:
---------
Icons are LOW priority for initial development.
Focus on functionality first, polish later.
