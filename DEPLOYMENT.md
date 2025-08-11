# TaskMasterPro Deployment Guide

## 🚀 Quick Deployment to Vercel

### 1. Prerequisites
- GitHub account
- Vercel account
- Supabase account
- OpenAI API key
- Resend API key (for email features)

### 2. Environment Setup

#### Supabase Setup
1. Create a new Supabase project
2. Go to Settings > Database to get your connection string
3. Go to Settings > API to get your API keys
4. Enable Row Level Security (RLS) on all tables

#### Required Environment Variables
Set these in your Vercel dashboard:

```env
# Database
DATABASE_URL="postgresql://postgres.zhdckqfqabahanamlxwh:your_password@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://zhdckqfqabahanamlxwh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZGNrcWZxYWJhaGFuYW1seHdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzE3OTEsImV4cCI6MjA3MDUwNzc5MX0.b0EznLprAYIIiQTEXwdNituy12UiVSPDKat6_aIUY4A
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Resend (Email)
RESEND_API_KEY=your_resend_api_key_here

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.vercel.app

# Cron Jobs
CRON_SECRET=your_cron_secret_here
```

### 3. Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial TaskMasterPro deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy!

3. **Database Migration**
   ```bash
   # In Vercel dashboard or locally
   npx prisma db push
   ```

### 4. Post-Deployment Setup

#### Enable Cron Jobs
The application includes two cron jobs:
- **Daily Assessment** (6 AM daily): AI-powered task insights
- **Dependency Check** (8 AM daily): Dependency risk alerts

These are automatically configured in `vercel.json`.

#### Email Setup (Optional)
1. Create a Resend account
2. Add your domain for sending emails
3. Configure webhook for receiving emails

#### File Storage
Supabase Storage is automatically configured for file uploads.

## 🔧 Local Development

### 1. Clone and Install
```bash
git clone https://github.com/qesmsep/taskmasterpro.git
cd taskmasterpro
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 3. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

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

## 🔒 Security Considerations

1. **Row Level Security (RLS)**: All tables have RLS enabled
2. **API Authentication**: All API routes require valid Supabase tokens
3. **File Upload Validation**: Files are validated before storage
4. **Environment Variables**: Sensitive data is stored in environment variables

## 📊 Monitoring and Analytics

### Vercel Analytics
- Built-in performance monitoring
- Error tracking
- User analytics

### Database Monitoring
- Supabase dashboard for database metrics
- Query performance insights
- Storage usage tracking

## 🔄 CI/CD Pipeline

The application uses GitHub Actions for continuous deployment:

1. **Push to main branch** → Automatic deployment to Vercel
2. **Database migrations** → Run automatically on deployment
3. **Environment variables** → Managed through Vercel dashboard

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Verify Supabase project is active
   - Ensure RLS policies are configured

2. **Authentication Issues**
   - Verify Supabase API keys
   - Check NEXTAUTH configuration
   - Ensure user table exists

3. **AI Features Not Working**
   - Verify OpenAI API key
   - Check API rate limits
   - Ensure proper error handling

4. **File Upload Issues**
   - Check Supabase Storage configuration
   - Verify file size limits
   - Ensure proper CORS settings

### Support
- Check the [Issues](https://github.com/qesmsep/taskmasterpro/issues) page
- Create a new issue with detailed information
- Contact the development team

## 📈 Scaling Considerations

### Performance
- Database indexes on frequently queried fields
- Pagination for large datasets
- Caching for static content

### Cost Optimization
- Monitor OpenAI API usage
- Optimize database queries
- Use CDN for static assets

### Security
- Regular security audits
- Dependency updates
- Monitoring for suspicious activity

---

For additional support, refer to the main [README.md](README.md) file.
