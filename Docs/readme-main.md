# Wedding RSVP Application 💍

A complete wedding invitation and RSVP management system with WhatsApp integration, Excel-based guest management, and automated notifications.

## ✨ Features

- 📱 **WhatsApp Integration** - Send personalized invitations via Meta WhatsApp Business API
- 📊 **Excel Guest Management** - Upload guest lists and track responses
- 💌 **Custom Messages** - Personalize invitations with guest names
- 📎 **Invitation Cards** - Attach JPG/PNG/PDF invitation cards
- 📋 **RSVP Form** - Beautiful responsive form with Aadhar document upload
- 📧 **Email Notifications** - Automated Excel reports sent via email
- 📈 **Real-time Tracking** - Monitor invitation status and responses
- 👨‍💼 **Admin Panel** - Comprehensive dashboard for guest management

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Gmail account (for email notifications)
- Meta WhatsApp Business API credentials (optional)

### Installation

#### 1. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
# Add your Gmail, WhatsApp API, and other credentials

# Start the server
npm run dev
```

The backend will run on `http://localhost:3001`

#### 2. Frontend Setup

```bash
# Navigate to frontend folder (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will run on `http://localhost:3000`

## 📁 Project Structure

```
wedding-rsvp-app/
├── backend/
│   ├── server.js              # Main server file
│   ├── whatsapp-service.js    # WhatsApp API integration
│   ├── database.js            # MongoDB schemas
│   ├── package.json
│   ├── .env.example
│   └── uploads/               # Uploaded files
│       ├── aadhar/
│       └── invitations/
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── RSVPForm.js    # Guest RSVP form
│   │   │   └── AdminPanel.js   # Admin dashboard
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
│
└── README.md
```

## 🔧 Configuration

### Backend Environment Variables (`.env`)

```env
# Server
PORT=3001

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
NOTIFICATION_EMAIL=where-to-receive-rsvps@gmail.com

# WhatsApp API (Meta)
META_PHONE_NUMBER_ID=your-phone-number-id
META_ACCESS_TOKEN=your-access-token
META_WEBHOOK_VERIFY_TOKEN=your-verify-token

# Database (Optional)
MONGODB_URI=mongodb://localhost:27017/wedding-rsvp

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Gmail Setup

1. Enable 2-Step Verification in Google Account
2. Generate App Password: Account Settings → Security → App Passwords
3. Use the 16-character password in `EMAIL_PASS`

### WhatsApp Setup

See `META_WHATSAPP_SETUP.md` for detailed instructions on:
- Creating Meta Developer account
- Setting up WhatsApp Business API
- Getting access tokens
- Configuring webhooks

## 📱 Usage

### Admin Panel

Access at: `http://localhost:3000/admin`

1. **Write Custom Message** - Use `{name}` placeholder for personalization
2. **Upload Invitation Card** - Optional JPG/PNG/PDF attachment
3. **Upload Guest List** - Excel file with "Guest Name" and "Phone Number" columns
4. **Preview Message** - See how messages will look
5. **Send Invitations** - Bulk send to all guests via WhatsApp

### RSVP Form

Access at: `http://localhost:3000/rsvp`

Guests can:
- Fill in their details
- Choose attendance (Yes/Maybe/No)
- Upload Aadhar document
- Submit response

After submission:
- Data saved to Excel file
- Email sent to organizers with updated Excel
- WhatsApp confirmation sent to guest (optional)

## 📊 Guest List Excel Format

Download the template from the admin panel or create with these columns:

| Guest Name | Phone Number |
|------------|--------------|
| John Doe   | 9876543210   |
| Jane Smith | 9876543211   |

## 🌐 API Endpoints

### RSVP Endpoints
- `POST /api/rsvp/submit` - Submit RSVP response
- `GET /api/rsvp/all` - Get all RSVPs
- `GET /api/rsvp/stats` - Get statistics
- `GET /api/rsvp/download` - Download Excel file

### WhatsApp Endpoints
- `POST /api/whatsapp/send-invitation` - Send invitation to guest
- `POST /api/whatsapp/send-confirmation` - Send RSVP confirmation
- `GET /webhook` - Webhook verification
- `POST /webhook` - Receive WhatsApp messages

## 🚀 Deployment

### Frontend (Vercel - Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel
```

### Backend (Railway - Recommended)

1. Push code to GitHub
2. Connect repository to Railway
3. Add environment variables
4. Deploy automatically

See deployment guide in `DEPLOYMENT.md` for detailed instructions.

## 🛠️ Tech Stack

**Frontend:**
- React 18
- React Router
- Tailwind CSS
- Lucide Icons
- SheetJS (XLSX)

**Backend:**
- Node.js
- Express
- Multer (file uploads)
- Nodemailer (email)
- ExcelJS (Excel generation)
- Axios (HTTP client)
- Mongoose (MongoDB, optional)

**APIs:**
- Meta WhatsApp Business API
- Gmail SMTP

## 📝 License

MIT License - feel free to use for your wedding!

## 💡 Tips

1. **Test First** - Test with your own number before sending to all guests
2. **Rate Limits** - Built-in 2-second delay between messages to respect WhatsApp limits
3. **Backup Data** - Regularly backup the Excel file and uploads folder
4. **Custom Domain** - Use a custom domain for professional RSVP links
5. **Templates** - For production, use approved WhatsApp message templates

## 🆘 Support

For setup help:
- Check `SETUP_INSTRUCTIONS.md`
- Check `META_WHATSAPP_SETUP.md` for WhatsApp API
- Open an issue on GitHub

## 🎉 Credits

Built with ❤️ for your special day!

---

**Happy Wedding Planning! 💕**