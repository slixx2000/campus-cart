# CampusCart 🛒🇿🇲

**Zambia's campus marketplace** — connecting student entrepreneurs with fellow students across universities.

## Overview

CampusCart is a marketplace website built for Zambian university campuses. It allows young business owners to reach more students and helps students find products and services easier — all on campus.

## Features

- 🛍️ **Browse listings** by category, university, keyword, or price range
- 📝 **Post listings** for free (products & services)
- 🎓 **8+ Zambian universities** supported (UNZA, CBU, Mulungushi, Northrise, Cavendish, etc.)
- 📱 **WhatsApp & phone contact** for direct seller communication
- 💰 **Zambian Kwacha (K)** pricing
- 📦 **10 categories**: Food & Drinks, Electronics, Books, Tutoring, Services, and more
- 📱 Fully responsive, mobile-first design

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

```bash
npm run build
npm run start
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Home page
│   ├── browse/           # Browse & search listings
│   ├── product/[id]/     # Product detail page
│   ├── sell/             # Post a listing form
│   └── about/            # About CampusCart
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ProductCard.tsx
│   └── CategoryCard.tsx
├── lib/
│   └── data.ts           # Universities, categories & sample listings
└── types/
    └── index.ts          # TypeScript types
```
