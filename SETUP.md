# Setup Guide

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

## Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select an existing one
3. Go to Settings → API
4. Copy the Project URL and anon/public key
5. Replace the values in your `.env.local` file

## Database Setup

After setting up your Supabase project:

1. In your Supabase dashboard, go to the SQL Editor
2. Run the migration file: `supabase/migrations/001_initial_schema.sql`
3. Optionally, run the seed file: `supabase/seed.sql` for sample data

## OpenAI API Key

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env.local` file

## Running the Project

```bash
npm run dev
```

The application will be available at `http://localhost:3000`
