# SwapLearnThrive - Skill Exchange Platform

## 🌟 Project Overview

SwapLearnThrive is a full-stack web application that enables users to exchange skills through teaching and learning. It's a platform where people can offer skills they're proficient in and learn skills they're interested in from others in the community.

## ✨ Key Features

- **User Authentication**: Secure registration and login system
- **Skill Management**: Add, edit, and manage skills you can teach or want to learn
- **Intelligent Matching**: Advanced algorithm to match teachers with learners
- **Real-time Messaging**: Built-in chat system for communication
- **Scheduling System**: Schedule learning sessions with matched users
- **Rating & Reviews**: Rate and review your learning experiences
- **Admin Dashboard**: Comprehensive admin panel for platform management
- **Responsive Design**: Mobile-friendly interface with modern UI

## 🚀 Technology Stack

### Frontend
- **React 18.3.1** - Modern UI library
- **TypeScript 5.8.3** - Type-safe JavaScript
- **Vite 4.5.2** - Fast build tool and dev server
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **shadcn-ui** - Modern component library
- **React Router DOM 6.30.1** - Client-side routing
- **React Hook Form 7.61.1** - Form management
- **Zod 3.25.76** - Schema validation

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **Nodemailer** - Email service

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ installed
- npm package manager
- MongoDB database (local or MongoDB Atlas)

### Frontend Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/swap-learn-thrive.git

# Navigate to project directory
cd swap-learn-thrive

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Create environment file (copy from .env.example)
cp .env.example .env

# Edit .env file with your configurations
# Add your MongoDB connection string and other required variables

# Start backend server
node server.js
```

### Environment Variables
Create a `.env` file in the backend directory with:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email_for_notifications
EMAIL_PASS=your_email_password
PORT=5000
```

## 🎯 Getting Started

1. **Start both servers**:
   - Frontend: `npm run dev` (runs on port 8081)
   - Backend: `cd backend && node server.js` (runs on port 5000)

2. **Seed the database** (optional):
   ```bash
   cd backend
   node scripts/seedData.js
   ```

3. **Access the application**:
   - Frontend: http://localhost:8081
   - Backend API: http://localhost:5000

## 📱 Application Workflow

1. **Registration/Login**: Users create accounts and authenticate
2. **Profile Setup**: Complete profile with skills and preferences
3. **Skill Management**: Add skills to teach and skills to learn
4. **Matching**: System matches compatible users
5. **Communication**: Message matched users
6. **Scheduling**: Schedule learning sessions
7. **Learning**: Conduct teaching/learning sessions
8. **Rating**: Provide feedback and ratings

## 🏗️ Project Structure

```
swap-learn-thrive/
├── backend/                 # Backend API server
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   └── scripts/            # Database scripts
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   └── lib/                # Utility libraries
├── public/                 # Public assets
└── tests/                  # Test files
```

## 🔧 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `node server.js` - Start backend server
- `node scripts/seedData.js` - Seed database with sample data

## 🌐 Deployment

### Frontend Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to platforms like Vercel, Netlify, or AWS S3
3. Update environment variables for production

### Backend Deployment
1. Deploy to platforms like Heroku, Railway, or AWS
2. Set up MongoDB Atlas for production database
3. Configure environment variables
4. Update CORS settings for production frontend URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Built with modern web technologies

## 📞 Support

If you have any questions or need help with setup, please open an issue or contact the development team.

---

**Repository**: https://github.com/MJ-Sec4yoU/swap-learn-thrive
