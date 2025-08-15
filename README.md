# IRIS AI - Inspection and Review Intelligence System

A sophisticated AI-powered validation system that automatically reviews calibration certificates against manufacturer specifications, ISO/IEC 17025 requirements, and customer-specific policies. Built with Next.js and featuring a modern glassmorphism design system.

## Features

- **AI-Powered Validation**: Three specialized AI services working in parallel
- **Modern Glassmorphism Design**: Beautiful glass card effects with gradient borders
- **Responsive Landing Page**: Comprehensive sections with interactive elements
- **User Authentication**: Complete auth system with Supabase
- **Dashboard**: Personalized user dashboard with usage statistics
- **Dark Theme**: Sophisticated dark theme with mint/teal accents
- **Real-time Processing**: Automated validation with detailed reporting

## Landing Page Sections

### 1. Hero Section
- **Background**: Layered grid, spotlight/halo, and noise textures
- **Interactive Elements**: Icon chips with hover effects
- **Call-to-Action**: Primary button with gradient styling
- **Typography**: Gradient headlines using `--grad-head` variable

### 2. What It Is Section
- **Layout**: Two-column grid (text + feature card)
- **Glass Card**: Right-side feature card with glassmorphism effect
- **Icon Chips**: Four feature highlights with `icon-chip` styling
- **Benefits List**: Three key benefits with colored indicators

### 3. Orchestrator Section
- **Flow Diagram**: Three-step process with arrows
- **Glass Cards**: Each step in a glass card with hover effects
- **Responsive**: Desktop horizontal flow, mobile vertical with indicators
- **Icons**: Step-specific icons with `icon-chip` styling

### 4. Validation Services Section
- **Three AI Services**: Tolerance Verification, CMC Conformance, Customer Requirements
- **Glass Cards**: Each service in a glass card with hover effects
- **Hierarchical Display**: Detailed breakdowns with numbered items
- **Color Coding**: Emerald, teal, and cyan themes for each service

### 5. Call-to-Action Section
- **Glass Card**: Main section with glassmorphism effect
- **Spotlight Halo**: Decorative background element
- **Status Indicators**: Real-time processing status with colored dots
- **Primary Button**: Gradient styling with hover effects

## Design System & Styling

### Color Palette
- **Primary Accents**: Mint (`#8CFFC8`) and Teal (`#38BD94`)
- **Background**: Deep dark (`hsl(180 18% 7%)`)
- **Surface**: Glass effect with `rgba(255, 255, 255, 0.05)`
- **Text**: White for primary, muted for secondary
- **Borders**: Subtle gradients with transparency

### CSS Variables (Custom Design System)
```css
--grad-head: linear-gradient(90deg, #8CFFC8 0%, #38BD94 100%)
--muted-text: hsl(180 1% 48%)
--mint-1: #8CFFC8
--mint-2: #6BFFB8
--mint-3: #4AFFA8
--teal-1: #38BD94
--teal-2: #2A9D7A
```

### Glass Card Styling
- **Background**: `bg-[var(--surface)]/80` with backdrop blur
- **Borders**: Gradient borders using `mask` and `mask-composite`
- **Hover Effects**: Subtle lift and glow effects
- **Pseudo-elements**: Decorative borders and highlights

### Icon Chip Styling
- **Background**: `bg-white/5` with rounded corners
- **Icons**: White icons with consistent sizing
- **Hover**: Subtle glow effects

### Typography
- **Headlines**: Gradient text using `bg-clip-text`
- **Body Text**: White for primary, muted for secondary
- **Font Weights**: Semibold for headlines, medium for emphasis

## Stack

This application is built with:

- **Framework:** [Next.js](https://nextjs.org/) 15.4.4
- **Auth and user management:** [Supabase](https://supabase.com/)
- **Component library:** [shadcn/ui](https://ui.shadcn.com/)
- **CSS framework:** [Tailwind](https://tailwindcss.com/) 4.1.11
- **Icons:** [Lucide React](https://lucide.dev/)
- **Styling:** Custom glassmorphism design system

## Prerequisites

### Local dev environment

- [Node.js](https://nodejs.org/en/download/package-manager/current) version > `20`
- [npm](https://www.npmjs.com/), [Yarn](https://yarnpkg.com/), or [pnpm](https://pnpm.io/)

### Production deployment

- [Google Cloud Account](https://cloud.google.com/) with billing enabled
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) (gcloud)
- [Docker](https://docs.docker.com/get-docker/) for containerization

### Accounts

- [Vercel account](https://vercel.com/) (for deployment)
- [Supabase account](https://supabase.com/) (for authentication and database)

## Quick Start

### 1. Clone the repository

   ```sh
git clone <your-repo-url>
cd iris-ai
   ```

### 2. Install dependencies

   ```sh
   npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_USER=postgres.your_project_ref
SUPABASE_PASSWORD=your_database_password
SUPABASE_PORT=6543
SUPABASE_DBNAME=postgres

# Site URL (for production)
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### 4. Set up Supabase

1. Create a new project in Supabase
2. Run the database migrations in the `supabase/migrations/` folder
3. Configure authentication providers in your Supabase dashboard

### 5. Run the development server

   ```sh
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/callback/     # Auth callback handling
│   ├── dashboard/         # User dashboard
│   ├── login/            # Login page
│   └── signup/           # Signup page
├── components/           # React components
│   ├── authentication/   # Auth forms
│   ├── dashboard/        # Dashboard components
│   ├── home/            # Landing page components
│   │   ├── hero-section/ # Hero section with background layers
│   │   ├── sections/     # Main content sections
│   │   │   ├── what-it-is.tsx
│   │   │   ├── orchestrator.tsx
│   │   │   ├── validation-services.tsx
│   │   │   └── cta.tsx
│   │   ├── pricing/      # Pricing components
│   │   └── footer/       # Footer components
│   ├── gradients/       # Visual effects and backgrounds
│   └── ui/              # Base components (shadcn/ui)
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and types
├── styles/              # CSS styles
│   ├── globals.css      # Global styles and variables
│   ├── home-page.css    # Home page specific styles
│   ├── login.css        # Login page styles
│   └── dashboard.css    # Dashboard styles
└── utils/               # Utility functions
    └── supabase/        # Supabase integration
```

## AI Services Architecture

### 1. Tolerance Verification (3.1)
- **Purpose**: Verify tolerances match manufacturer specifications
- **Process**: 5-level hierarchical search
- **Output**: PASS/FAIL/CANNOT_VERIFY with confidence scores

### 2. CMC Conformance (3.2)
- **Purpose**: Validate uncertainty compliance with ISO/IEC 17025
- **Process**: LLM + computational analysis
- **Output**: Status by measurement and compliance summary

### 3. Customer Requirements (3.3)
- **Purpose**: Evaluate customer-specific policies and procedures
- **Process**: Segmented parallel execution
- **Output**: Evaluation by group with justification

## Authentication

The app uses Supabase for authentication with the following features:

- Email/password authentication
- Anonymous login (for testing)
- GitHub OAuth integration
- Session management with middleware

## Deployment

### Deploy on Google Cloud Run (Recommended)

This application is optimized for Google Cloud Run deployment. See the comprehensive deployment guide in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

#### Quick Start

1. **Configure environment variables** using [`env.template`](./env.template) as a guide
2. **Update the deployment script** with your project ID:
   ```bash
   # Edit deploy.sh and replace 'your-project-id' with your actual project ID
   PROJECT_ID="your-actual-project-id"
   ```
3. **Run the deployment**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

#### Alternative Deployment Methods

- **Cloud Build CI/CD**: Use [`cloudbuild.yaml`](./cloudbuild.yaml) for automated deployments
- **Manual Deployment**: Follow the step-by-step instructions in [`DEPLOYMENT.md`](./DEPLOYMENT.md)

### Deploy on Vercel (Alternative)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel
4. Deploy!

### Environment Variables for Production

Make sure to set these environment variables:

#### Required for CloudRun
- `NEXTAUTH_URL` - Your application URL
- `NEXTAUTH_SECRET` - NextAuth secret key
- `SESSION_SECRET` - Session encryption key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

#### Optional (if using Supabase)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run prettier` - Format code with Prettier

### Code Style

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
