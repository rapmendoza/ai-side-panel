# AI-Powered Side Panel Setup Guide

## Implementation Status

✅ **COMPLETED PHASES:**

- Phase 1: Project Setup & Database
- Phase 2: Database Layer (API endpoints, database services, utilities)
- Phase 3: AI Integration (OpenAI client, intent processing, AI API routes)
- Phase 4: Side Panel UI (responsive design, chat interface, message components)

🔄 **CURRENT PHASE:**

- Phase 5: Final integration and testing

## Quick Start

### 1. Environment Setup

1. Copy the environment variables file:

   ```bash
   cp .env.example .env.local
   ```

2. Configure your environment variables in `.env.local`:

   **Supabase Configuration:**

   - Create a project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key from Settings → API
   - Update `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   **OpenAI Configuration:**

   - Get an API key from [OpenAI](https://platform.openai.com/api-keys)
   - Update `OPENAI_API_KEY`

### 2. Database Setup

1. Run the database migrations in your Supabase SQL editor:

   ```sql
   -- Copy and run the contents of supabase/migrations/001_initial_schema.sql
   ```

2. (Optional) Seed with sample data:
   ```sql
   -- Copy and run the contents of supabase/seed.sql
   ```

### 3. Install Dependencies and Run

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Features

### Current Functionality

1. **Natural Language Payee Management**

   - Create: "Add a new payee called John's Coffee Shop"
   - Read: "Show me all payees" or "Find payees with 'bank' in the name"
   - Update: "Update the description for payee [ID]"
   - Delete: "Delete the payee called ABC Corp"

2. **Natural Language Category Management**

   - Create: "Create an expense category for office supplies"
   - Read: "Show me all categories" or "List categories as a tree"
   - Update: "Change the category type to income"
   - Delete: "Remove the marketing category"

3. **AI-Powered Chat Interface**

   - Responsive side panel design
   - Real-time conversation with AI
   - Intent classification and entity extraction
   - Clarification workflows for ambiguous requests
   - Loading states and error handling

4. **Database Integration**
   - PostgreSQL with Supabase
   - Full CRUD operations for payees and categories
   - Proper data validation and sanitization
   - RESTful API endpoints

### API Endpoints

- `GET/POST /api/payees` - List/create payees
- `GET/PUT/DELETE /api/payees/[id]` - Individual payee operations
- `GET/POST /api/categories` - List/create categories
- `GET/PUT/DELETE /api/categories/[id]` - Individual category operations
- `POST /api/ai/chat` - Main AI chat interface
- `POST /api/ai/process-intent` - Intent classification

## Architecture

### Tech Stack

- **Frontend**: Next.js 14+ with TypeScript
- **UI**: Shadcn UI components with Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini
- **State Management**: React hooks

### Key Components

- `SidePanel` - Main AI assistant container
- `ChatInterface` - Message display and scrolling
- `MessageBubble` - Individual message rendering
- `InputArea` - Message input with send functionality

### AI Processing Pipeline

1. **Intent Classification** - Determine action (create/read/update/delete) and entity (payee/category)
2. **Entity Extraction** - Extract relevant data from natural language
3. **Clarification** - Ask follow-up questions for ambiguous requests
4. **Database Operations** - Execute the appropriate CRUD operations
5. **Response Generation** - Provide natural language feedback

## Testing the Application

### Example Conversations

1. **Creating a Payee:**

   ```
   User: "Add a new payee called Starbucks with email contact@starbucks.com"
   AI: "I've successfully created a new payee called Starbucks with the email contact@starbucks.com."
   ```

2. **Searching Categories:**

   ```
   User: "Show me all expense categories"
   AI: "Here are all your expense categories: [list of categories]"
   ```

3. **Clarification Workflow:**
   ```
   User: "I want to add something"
   AI: "What would you like to add - a payee or a category?"
   User: "A payee called ABC Corp"
   AI: "I've created a new payee called ABC Corp."
   ```

## Troubleshooting

### Common Issues

1. **Environment Variables Not Working**

   - Ensure `.env.local` exists and has correct values
   - Restart the development server after changes

2. **Supabase Connection Errors**

   - Verify your Supabase URL and anon key
   - Check that the database tables exist

3. **OpenAI API Errors**

   - Verify your OpenAI API key is valid
   - Check your OpenAI account has sufficient credits

4. **TypeScript Errors**
   - Run `npm run lint` to check for issues
   - Ensure all dependencies are properly installed

## Next Steps

The core functionality is complete. Optional enhancements could include:

- Conversation history persistence
- More sophisticated entity extraction
- Bulk operations support
- Advanced search and filtering
- User authentication
- Multi-language support
- Export/import functionality

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the API endpoint responses for error details
3. Check browser console for client-side errors
4. Verify database table structure matches the schema
