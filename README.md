# Personal Academic Homepage

A clean, responsive personal academic homepage built with Next.js, deployed on GitHub Pages.

## Features

- **Responsive Design** - Optimized for both desktop and mobile devices
- **Multiple Sections** - About, Publications, CV, Awards, and Service
- **Markdown Support** - Content can be edited using Markdown formatting
- **Interactive UI** - Smooth scroll navigation and scroll progress indicator
- **Easy Customization** - All personal information centralized in config files

## Tech Stack

- **Framework**: Next.js 15.1.3
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3.4.1
- **Language**: TypeScript
- **Deployment**: GitHub Pages with GitHub Actions CI/CD

## Project Structure

```
Lu_website/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── layout/       # Layout components (Header, Sidebar)
│   └── sections/     # Page section components
│       ├── AboutSection.tsx
│       ├── PublicationList.tsx
│       ├── EducationExperience.tsx
│       ├── AwardsSection.tsx
│       └── ServiceSection.tsx
├── config/          # Configuration files
│   └── site.ts      # Personal information and content
├── public/          # Static assets (images, logos)
└── .github/         # GitHub Actions workflows
```

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
# Create production build
npm run build
```

## Customization

All personal information is configured in `config/site.ts`:

- **Profile**: name, title, email, department, university
- **Social Links**: Google Scholar, Twitter, LinkedIn, GitHub
- **Navigation**: menu items and links
- **Content**: About description, news, publications, education, experience, awards, service

## Deployment

This project uses GitHub Actions for automatic deployment to GitHub Pages.

- **Live Site**: [https://yiyinyinguu.github.io](https://yiyinyinguu.github.io)
- **Deployment Branch**: `homepage-v2`
- **CI/CD**: GitHub Actions workflow (`.github/workflows/deploy.yml`)

### Deployment Process

1. Push changes to `homepage-v2` branch
2. GitHub Actions automatically builds the project
3. Deployed to GitHub Pages
4. Site updates within 2-5 minutes

## Configuration Files

- `next.config.mjs` - Next.js configuration with static export
- `tailwind.config.ts` - Tailwind CSS customization
- `tsconfig.json` - TypeScript configuration

## License

This project is for personal use.
