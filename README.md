# Habit Tracker App

A modern habit tracking application built with Next.js 15, featuring habit management, Pomodoro timer, and comprehensive analytics.

## Features

- **Habit Management**: Create, track, and manage daily habits
- **Pomodoro Timer**: Built-in productivity timer with work/break sessions
- **Analytics Dashboard**: Comprehensive statistics and progress tracking
- **User Authentication**: Secure authentication powered by Clerk
- **Responsive Design**: Beautiful UI that works on all devices
- **Real-time Data**: MongoDB integration for persistent data storage

## Technology Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Clerk Auth
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database (local or MongoDB Atlas)
- Clerk account for authentication

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/trashhpandaaaa/habitflow
   cd habitflow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see above)

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Routes

- `GET/POST /api/habits` - Habit CRUD operations
- `GET/PUT/DELETE /api/habits/[id]` - Individual habit management
- `POST /api/habits/[id]/complete` - Mark habit as complete
- `GET/POST /api/completions` - Habit completion tracking
- `GET /api/stats` - User statistics and analytics
- `GET/POST /api/pomodoro` - Pomodoro session management
- `GET/PUT /api/user/profile` - User profile management
- `POST /api/webhooks/clerk` - Clerk user sync webhook

## Database Models

- **User**: User profile and Clerk integration
- **Habit**: Individual habit definitions
- **HabitCompletion**: Daily habit completion records
- **PomodoroSession**: Pomodoro timer session records

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- Render
- AWS Amplify
- DigitalOcean App Platform

### Environment Setup for Production

1. Set up MongoDB Atlas or your preferred MongoDB hosting
2. Configure Clerk for production domain
3. Add all required environment variables
4. Set up webhook endpoint for Clerk user sync

## Development

### Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (home)/         # Protected routes
│   ├── api/            # API endpoints
│   └── globals.css     # Global styles
├── components/         # Reusable UI components
├── lib/                # Utilities and configurations
├── models/             # MongoDB models
└── services/           # API service layer
```

### Key Components

- `habit-card.tsx` - Individual habit display and interaction
- `pomodoro-timer.tsx` - Pomodoro timer functionality
- `stats-overview.tsx` - Statistics dashboard
- `navbar.tsx` - Navigation and user menu

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
