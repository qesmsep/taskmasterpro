# TaskMasterPro

An everyday, due-date-driven task brain that expands fuzzy ideas into crisp plans, guards your schedule with dependency-aware alerts, and keeps comms/files glued to the work—without collaboration bloat.

## 🚀 Features

### Core Features
- **AI-Powered Task Expansion**: Transform vague tasks into actionable subtasks
- **Smart Scheduling**: Due-date-driven prioritization with dependency-aware alerts
- **Integrated Communication**: Send emails and track conversations within tasks
- **File Management**: Attach files and notes with automatic parent propagation
- **Recurring Tasks**: Flexible recurrence patterns with inherited properties
- **Risk Alerts**: Get notified only when due dates and dependencies matter
- **Multi-User Support**: Secure authentication with Supabase Auth

### Views
- **Today View**: Overdue, Today, Next 3–4 Days
- **Category Boards**: Personal, Business, App Dev
- **Task Detail View**: Subtasks, AI Panel, Communications, Attachments
- **Archive View**: Completed tasks, searchable

## 🛠 Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: Supabase PostgreSQL
- **File Storage**: Supabase Storage
- **Email**: Resend for outbound/inbound email
- **AI**: OpenAI API for task expansion and assessments
- **Authentication**: Supabase Auth
- **Deployment**: Vercel with cron jobs
- **UI Components**: Radix UI with Apple-inspired design

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key
- Resend API key (for email features)
- Vercel account (for deployment)

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/qesmsep/taskmasterpro.git
cd taskmasterpro
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="your_supabase_database_url"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Resend (Email)
RESEND_API_KEY=your_resend_api_key

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 4. Set up the database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🗄 Database Schema

The application uses the following main entities:

- **Users**: Authentication and user profiles
- **Tasks**: Main task entities with hierarchical structure
- **Categories**: Task categorization
- **TaskDependencies**: Dependency relationships between tasks
- **Attachments**: File attachments with parent propagation
- **Communications**: Email and note communications
- **TimeBlocks**: Time tracking for tasks
- **Notifications**: System notifications and alerts

## 🔧 API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks for a user
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/[id]` - Get a specific task
- `PUT /api/tasks/[id]` - Update a task
- `DELETE /api/tasks/[id]` - Delete a task

### AI Features
- `POST /api/ai/expand-task` - Expand a task using AI

### Categories
- `GET /api/categories` - Get user categories
- `POST /api/categories` - Create a category

### Attachments
- `POST /api/attachments` - Upload a file
- `DELETE /api/attachments/[id]` - Delete an attachment

## 🎨 Design System

The application uses an Apple-inspired design system with:

- Clean, minimal interface
- Rounded corners and subtle shadows
- Apple's color palette
- Smooth animations and transitions
- Responsive design for all devices

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your Vercel dashboard:

```env
DATABASE_URL=your_production_database_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
RESEND_API_KEY=your_resend_api_key
NEXTAUTH_SECRET=your_production_secret
NEXTAUTH_URL=https://your-domain.vercel.app
```

## 🔒 Security

- All API routes are protected with Supabase authentication
- User data is isolated per user
- File uploads are validated and stored securely
- Environment variables are properly configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/qesmsep/taskmasterpro/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🗺 Roadmap

### Version 2.0 (Post-MVP)
- Analytics dashboard with completion trends
- Task templates
- Advanced filters beyond category/due date
- Effort estimates for AI scheduling
- Multi-user collaboration mode
- Mobile app (React Native)
- Calendar integration
- Time tracking improvements
- Advanced AI features

---

Built with ❤️ by the TaskMasterPro team
# taskmasterpro
