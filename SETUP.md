# FitTrack - Setup Guide

This is a personalized fitness application that provides different experiences for beginners, intermediate, and pro users.

## Features

- **Personalized Dashboards**: Three distinct dashboards tailored to different fitness levels
- **Supabase Authentication**: Secure user authentication and profile management
- **Level Switching**: Easy switching between fitness levels for testing and progression
- **Modern UI**: Clean, responsive design with Tailwind CSS

## Prerequisites

1. Node.js 18+ installed
2. A Supabase account and project
3. pnpm (recommended) or npm

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your URL and anon key

### 2.5. Set up Gemini AI (for meal photo analysis)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key for Gemini
3. Copy the API key for the next step

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

### 4. Set up the Database

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the SQL commands from `database-setup.sql` to create the profiles table and policies
4. Run the SQL commands from `database-fitness-schema.sql` to create the fitness tracking tables

**Important**: Make sure to run both SQL files in order. The second file creates the workout tracking, nutrition, streaks, and awards systems.

### 5. Configure Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Under "Site URL", add your local development URL: `http://localhost:3000`
3. Under "Redirect URLs", add: `http://localhost:3000/dashboard`

### 6. Run the Application

```bash
pnpm dev
```

Visit `http://localhost:3000` to see the application.

## Usage

1. **Sign Up**: Create a new account and select your fitness level
2. **Dashboard**: View your personalized dashboard based on your fitness level
3. **Level Switching**: Use the dropdown in the top-right to switch between levels for testing
4. **Sign Out**: Use the sign out button in the header

## Fitness Levels

- **Beginner**: Basic workouts, simple nutrition, safety guidelines
- **Intermediate**: Advanced workouts, performance tracking, nutrition optimization
- **Pro**: Elite training, performance analytics, competition preparation

## Project Structure

```
src/
├── app/
│   ├── login/           # Login page
│   ├── signup/          # Signup page
│   ├── dashboard/       # Main dashboard page
│   └── page.tsx         # Landing page
├── components/
│   ├── auth/            # Authentication components
│   ├── dashboards/      # Level-specific dashboards
│   ├── dashboard.tsx    # Main dashboard component
│   └── level-switcher.tsx # Level switching dropdown
└── lib/
    ├── supabase.ts      # Supabase client
    └── auth-context.tsx # Authentication context
```

## Development

The application uses:
- **Next.js 15** with App Router
- **Supabase** for authentication and database
- **Tailwind CSS** for styling
- **TypeScript** for type safety

## Deployment

1. Deploy to Vercel, Netlify, or your preferred platform
2. Add your environment variables to the deployment platform
3. Update the Supabase redirect URLs to include your production domain

## Troubleshooting

### Data Not Saving
1. Check browser console for error messages
2. Verify your Supabase URL and anon key in `.env.local`
3. Ensure both database SQL files have been run
4. Check that Row Level Security policies are properly set up

### Tables Not Found Error
- Make sure you've run both `database-setup.sql` AND `database-fitness-schema.sql`
- Verify the tables exist in your Supabase dashboard under Database > Tables

### Authentication Issues
- Check that your site URL and redirect URLs are correctly configured in Supabase
- Verify your environment variables are properly set

## Features

### Habit Building System
- **Interactive Calendar**: Click dates to log workouts and nutrition
- **Workout Timer**: Start/stop timer that automatically logs workout time
- **AI Meal Analysis**: Take photos of meals for automatic calorie estimation
- **Today's Meals Tracker**: View all meals logged today with calorie breakdown
- **Streak System**: Gamified streaks with 1-2 day rest allowance
- **Achievement Awards**: 13 different awards for motivation
- **Visual Progress**: Green checkmarks for completed days, red X for missed days

### Streak Rules
- Work out daily to maintain your streak
- 1-2 day gaps are allowed for rest days
- 3+ day gaps will reset your streak
- Achievements unlock automatically based on progress

## Customization

- Modify dashboard content in `src/components/dashboards/`
- Add new fitness levels by updating the type definitions and adding new dashboard components
- Customize styling in the Tailwind classes or add custom CSS
- Add new achievements by modifying the awards table in the database 