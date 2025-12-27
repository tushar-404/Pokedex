# Pokedex (Charizard Dex)

A Next.js app that displays a Pokédex with rich UI, search and filtering, and a detailed modal for each Pokémon. This project uses the App Router, TypeScript, and Tailwind CSS v4.

## Tech Stack
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4

## Getting Started
1. Install dependencies
   - npm install
2. Run the development server
   - npm run dev
3. Open the app
   - http://localhost:3000

## Scripts
- dev: Start the dev server
- build: Build the production bundle
- start: Run the production server
- lint: Run ESLint

## Project Structure
- src/app: App Router entry (layout, pages, styles)
- src/components: UI components (cards, modals, search controls, effects)
- src/data: Static data (pokemon, evolutions)
- src/types: Shared TypeScript types
- public: Static assets (images, icons)

## Deployment
- Build: npm run build
- Start: npm start
- You can deploy on any Node-compatible host or Vercel.

## Notes
- Tailwind v4 is configured via postcss and @theme blocks in src/app/globals.css.
- Type definitions are in src/types.
