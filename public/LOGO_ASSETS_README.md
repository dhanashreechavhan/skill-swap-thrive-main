# Custom Logo Assets

This directory contains your custom logo and branding assets.

## Required Files:

### 1. Logo Files
- `logo.svg` - Main logo (SVG format recommended for scalability)
- `logo.png` - PNG version for fallback (512x512px recommended)
- `logo-white.svg` - White version for dark backgrounds
- `logo-icon.svg` - Icon only version (for favicons, small sizes)

### 2. Favicon Files
- `favicon.ico` - Traditional favicon
- `apple-touch-icon.png` - Apple touch icon (180x180px)
- `og-image.png` - Open Graph image for social sharing (1200x630px)

### 3. Brand Colors
Update your brand colors in:
- `src/index.css` - CSS custom properties
- `tailwind.config.ts` - Tailwind color configuration

## Usage Instructions:

1. **Add your logo files** to the `public/` directory
2. **Update the Logo component** (`src/components/Logo.tsx`)
3. **Replace favicon** in `public/favicon.ico`  
4. **Update brand colors** in theme files
5. **Test across all pages** to ensure consistency

## Current Logo Implementation:

The app currently uses:
- BookOpen icon from Lucide React
- "SwapLearnThrive" as brand name
- Primary gradient background for logo container

Replace these with your custom branding!