# 🚀 Free Deployment Guide for Skill Swap & Thrive

This guide will help you deploy your Skill Swap & Thrive application for free using the best available platforms.

## 📋 Prerequisites

1. GitHub account
2. MongoDB Atlas account (free)
3. Netlify account (for frontend)
4. Render account (for backend)

## 🗄️ 1. Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new project called "SkillSwap"

### Step 2: Create a Free Cluster
1. Select "Shared" tier (free)
2. Choose AWS provider and a free region (e.g., N. Virginia)
3. Keep the M0 Sandbox cluster (free forever)
4. Click "Create Cluster"

### Step 3: Configure Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Create a user with:
   - Username: `skillswap_user`
   - Password: Generate a strong password
   - Permissions: "Read and write to any database"
4. Click "Add User"

### Step 4: Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### Step 5: Get Connection String
1. Go to "Database" → "Cluster" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `myFirstDatabase` with `skillswap`

Example:
```
mongodb+srv://skillswap_user:your_password@cluster0.xxxxx.mongodb.net/skillswap?retryWrites=true&w=majority
```

## 🌐 2. Frontend Deployment (Netlify)

### Why Deploy Frontend Separately?
- Frontend consists of static files (HTML, CSS, JS) that browsers can directly load
- No server-side processing needed
- Static hosting is faster and cheaper
- CDN distribution for global access

### Step 1: Prepare Frontend for Deployment
1. Create a production environment file:
   ```bash
   # Create .env.production in the root directory
   VITE_API_URL=https://your-backend-url.onrender.com/api
   VITE_APP_NAME=Skill Swap & Thrive
   VITE_APP_ENV=production
   ```

### Step 2: Deploy to Netlify
1. Go to [Netlify](https://www.netlify.com/)
2. Sign up for a free account
3. Click "New site from Git"
4. Connect to your GitHub repository
5. Configure build settings:
   - Build command: `npm install --legacy-peer-deps && npm run build`
   - Publish directory: `dist`
6. Add environment variables in "Site settings" → "Build & deploy" → "Environment":
   - `VITE_API_URL` = your backend URL (you'll get this after deploying backend)
   - `VITE_APP_NAME` = Skill Swap & Thrive
   - `VITE_APP_ENV` = production
7. Click "Deploy site"

## ⚙️ 3. Backend Deployment (Render)

### Why Deploy Backend Separately?
- Backend needs a continuously running Node.js server
- Handles API requests, database operations, authentication
- Requires environment variables and server configuration
- Needs to maintain persistent connections

### Step 1: Prepare Backend for Deployment
1. Create a production environment file in the backend directory:
   ```bash
   # Create .env.production in the backend directory
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters
   FRONTEND_URL=https://your-frontend-url.netlify.app
   FRONTEND_URL_2=https://your-custom-domain.com
   ```

### Step 2: Create Render Account
1. Go to [Render](https://render.com/)
2. Sign up for a free account

### Step 3: Deploy Backend to Render
1. Click "New" → "Web Service"
2. Connect to your GitHub repository
3. Configure settings:
   - Name: `skillswap-backend`
   - Region: Choose the closest region
   - Branch: main (or your default branch)
   - Root Directory: `backend`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables:
   - `NODE_ENV` = production
   - `MONGODB_URI` = your MongoDB connection string
   - `JWT_SECRET` = your JWT secret
   - `FRONTEND_URL` = your Netlify frontend URL
5. Click "Create Web Service"

### Step 4: Configure Custom Domain (Optional)
1. In Render dashboard, go to your web service
2. Click "Settings" → "Custom domains"
3. Add your custom domain
4. Follow instructions to configure DNS

## 🔗 4. Connecting Frontend and Backend

### Step 1: Get Your Backend URL
1. After deploying to Render, you'll get a URL like:
   `https://skillswap-backend.onrender.com`
2. This is your backend URL

### Step 2: Update Frontend Environment Variables
1. Go to your Netlify site settings
2. Go to "Build & deploy" → "Environment"
3. Update `VITE_API_URL` to your Render backend URL:
   `https://skillswap-backend.onrender.com/api`
4. Trigger a new deployment by going to "Deploys" → "Trigger deploy" → "Deploy site"

## 🛠️ 5. Final Configuration

### Update Frontend Environment Variables
After deploying your backend:
1. Go to your Netlify site settings
2. Update `VITE_API_URL` to your Render backend URL
3. Redeploy the site

### Test Your Deployment
1. Visit your frontend URL
2. Try to register a new user
3. Test login functionality
4. Verify skill creation and matching features

## 📊 Free Tier Limitations

### Netlify
- 100GB bandwidth/month
- 300 build minutes/month
- 1000 functions invocations/day
- 125ms timeout for functions

### Render
- Web services sleep after 15 minutes of inactivity
- 750 hours of instance time/month
- 100GB bandwidth/month
- No custom domains on free tier (only paid plans)

### MongoDB Atlas
- 512MB storage
- Shared RAM (not dedicated)
- No SLA

## 💡 Optimization Tips

1. **Reduce Build Time**:
   - Clean up unused dependencies
   - Optimize images
   - Use code splitting effectively

2. **Improve Backend Performance**:
   - Add database indexes
   - Implement caching where appropriate
   - Optimize API responses

3. **Handle Render Sleep**:
   - Implement a health check endpoint
   - Consider using a cron job to ping your backend periodically

## 🚨 Important Security Notes

1. Never commit sensitive information to GitHub
2. Use strong, unique passwords
3. Rotate secrets regularly
4. Enable two-factor authentication on all accounts
5. Restrict database access to specific IP addresses when possible

## 🆘 Troubleshooting

### Common Issues

1. **Dependency Resolution Errors**:
   - If you encounter peer dependency conflicts during deployment, use `--legacy-peer-deps` flag
   - This is normal when different packages require different versions of the same dependency

2. **CORS Errors**:
   - Ensure `FRONTEND_URL` in backend matches your frontend URL
   - Check that your frontend URL is in the allowed origins list

3. **Database Connection Failures**:
   - Verify MongoDB connection string
   - Check database user credentials
   - Confirm network access rules

4. **Build Failures**:
   - Check build logs in Netlify/Render
   - Ensure all dependencies are correctly specified
   - Verify environment variables are set

5. **Backend Deployment Issues**:
   - Make sure your Render service is configured to use the `backend` directory as root
   - Verify that build and start commands are correct (`npm install` and `npm start`)
   - Check that all required environment variables are set

## 📈 Next Steps

1. Monitor your application usage
2. Set up error tracking (Sentry, etc.)
3. Implement analytics (Google Analytics, etc.)
4. Consider upgrading to paid tiers as your user base grows
5. Set up automated backups for your database

Your Skill Swap & Thrive platform is now deployed and accessible to users worldwide! 🎉