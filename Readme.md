# 💍 Wedding RSVP Application

A complete wedding invitation and RSVP management system with WhatsApp integration, Excel-based guest management, and automated email notifications.

![Wedding RSVP](https://img.shields.io/badge/Status-Production%20Ready-success)
![License](https://img.shields.io/badge/License-MIT-blue)
![Node](https://img.shields.io/badge/Node-18.x-green)
![React](https://img.shields.io/badge/React-18.2-blue)

## ✨ Features

### Guest RSVP Form
- 📝 Beautiful responsive form
- 👥 Multiple guests per submission
- 📅 Optional arrival/departure dates
- 📸 Multiple Aadhar document uploads
- ✅ Yes/Maybe/No attendance options
- 💕 Elegant design with validation

### Admin Panel
- 📊 Excel-based guest list management
- 💌 Custom message templates with personalization
- 📎 Invitation card attachments (JPG/PNG/PDF)
- 📱 WhatsApp bulk invitation sending
- 📈 Real-time statistics dashboard
- 🔍 Preview messages before sending
- ✅ Track invitation status (Sent/Failed/Pending)

### Backend Features
- 📧 Automated email notifications
- 📊 Excel generation with embedded images
- 📱 Meta WhatsApp Business API integration
- 🗄️ MongoDB support (optional)
- 🔒 Secure file uploads
- 📝 Detailed logging

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- Gmail account (for email)
- Meta WhatsApp Business API (optional)

### Local Development

1. **Clone the repository**
```bash
   git clone https://github.com/your-username/wedding-rsvp-app.git
   cd wedding-rsvp-app
```

2. **Setup Backend**
```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your credentials
   npm run dev
```

3. **Setup Frontend** (in new terminal)
```bash
   cd frontend
   npm install
   npm start
```

4. **Access the application**
   - RSVP Form: http://localhost:3000/rsvp
   - Admin Panel: http://localhost:3000/admin
   - Backend API: http://localhost:3001

## 📦 Deployment

### Recommended: Railway (Backend) + Vercel (Frontend)

See detailed guides in the `docs/` folder:
- [Complete Deployment Guide](docs/COMPLETE_DEPLOYMENT_README.md)
- [Vercel Deployment Guide](docs/VERCEL_DEPLOYMENT_GUIDE.md)

### Quick Deploy

**Backend (Railway):**
```bash
cd backend
railway login
railway init
railway up
```

**Frontend (Vercel):**
```bash
cd frontend
vercel --prod
```

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **File Processing:** SheetJS (XLSX)

### Backend
- **Runtime:** Node.js
- **Framework:** Express
- **File Upload:** Multer
- **Email:** Nodemailer
- **Excel:** ExcelJS
- **WhatsApp:** Meta Business API (Axios)
- **Database:** MongoDB (Optional)

## 📚 Documentation

- [Setup Instructions](docs/SETUP_INSTRUCTIONS.md)
- [Meta WhatsApp Setup](docs/META_WHATSAPP_SETUP.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [Deployment Guide](docs/COMPLETE_DEPLOYMENT_README.md)

## 🎯 Project Structure