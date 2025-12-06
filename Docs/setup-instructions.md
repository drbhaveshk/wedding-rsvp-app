# Wedding RSVP Backend - Setup Instructions

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (optional, for production)
- Gmail account (for email notifications)
- Twilio account (for WhatsApp integration)

## 🚀 Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=3001
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
NOTIFICATION_EMAIL=your-notification-email@gmail.com
FRONTEND_URL=http://localhost:3000
```

### 3. Set Up Gmail App Password

1. Go to Google Account Settings
2. Security → 2-Step Verification (enable if not already)
3. App Passwords → Generate new app password
4. Copy the 16-character password to `EMAIL_PASS` in `.env`

### 4. Set Up Twilio for WhatsApp (Optional)

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID and Auth Token
3. Enable WhatsApp Sandbox or get approved WhatsApp Business number
4. Add to `.env`:

```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 5. Set Up MongoDB (Optional - for production)

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# Then update .env:
MONGODB_URI=mongodb://localhost:27017/wedding-rsvp
```

**Option B: MongoDB Atlas (Cloud)**
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string and add to `.env`

### 6. Create Required Folders

```bash
mkdir -p uploads/aadhar
```

## 🎯 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will run on `http://localhost:3001`

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Submit RSVP
```
POST /api/rsvp/submit
Content-Type: multipart/form-data

Body:
- guestName: string
- date: string
- attending: 'yes' | 'no'
- aadharFile: file (or base64 aadharImage)
```

### Get All RSVPs
```
GET /api/rsvp/all
```

### Get Statistics
```
GET /api/rsvp/stats
```

### Download Excel
```
GET /api/rsvp/download
```

## 🔗 Connecting Frontend to Backend

Update your React app to connect to the backend:

```javascript
// In your React component
const handleSubmit = async () => {
  const formData = new FormData();
  formData.append('guestName', guestName);
  formData.append('date', date);
  formData.append('attending', attending);
  formData.append('aadharFile', aadharFile);

  const response = await fetch('http://localhost:3001/api/rsvp/submit', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  if (result.success) {
    // Show success message
  }
};
```

## 📧 Email Configuration Tips

### Gmail Setup Issues
If emails aren't sending:
1. Enable "Less secure app access" (not recommended) OR
2. Use App Password (recommended)
3. Check Gmail's sending limits (500 emails/day for free accounts)

### Alternative Email Services
- **SendGrid**: More reliable for production
- **AWS SES**: Good for high volume
- **Mailgun**: Developer-friendly

## 📱 WhatsApp Integration

### Sending Bulk Invitations

```javascript
const { sendBulkInvitations } = require('./whatsapp-service');

const guestList = [
  { name: 'John Doe', phoneNumber: '+919876543210' },
  { name: 'Jane Smith', phoneNumber: '+919876543211' }
];

const weddingDetails = {
  brideName: 'Priya',
  groomName: 'Rahul',
  date: '15th February 2025',
  time: '6:00 PM',
  venue: 'Grand Hotel, Mumbai',
  coupleName: 'Priya & Rahul'
};

sendBulkInvitations(guestList, weddingDetails);
```

## 📊 Excel File Location

The Excel file is automatically created at:
```
./wedding-rsvp-data.xlsx
```

## 🔒 Security Best Practices

1. **Never commit `.env` file** to version control
2. Use environment variables for all sensitive data
3. Enable CORS only for your frontend domain in production
4. Add rate limiting to prevent abuse
5. Validate and sanitize all inputs
6. Use HTTPS in production

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env or kill the process
lsof -ti:3001 | xargs kill
```

### Email Not Sending
- Check Gmail app password
- Verify 2-step verification is enabled
- Check spam folder
- Try with a different email service

### File Upload Issues
- Check folder permissions: `chmod 755 uploads/aadhar`
- Verify multer configuration
- Check file size limits

### WhatsApp Messages Not Sending
- Verify Twilio credentials
- Check WhatsApp sandbox activation
- Ensure phone numbers include country code (+91 for India)

## 📦 Project Structure

```
wedding-rsvp-backend/
├── server.js              # Main server file
├── whatsapp-service.js    # WhatsApp integration
├── database.js            # MongoDB schemas
├── package.json           # Dependencies
├── .env                   # Environment variables
├── .env.example           # Example env file
├── uploads/               # Uploaded files
│   └── aadhar/           # Aadhar documents
└── wedding-rsvp-data.xlsx # Generated Excel file
```

## 🚀 Deployment

### Deploying to Heroku
```bash
# Install Heroku CLI
heroku create wedding-rsvp-app
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASS=your-password
git push heroku main
```

### Deploying to Railway/Render
1. Connect GitHub repository
2. Add environment variables in dashboard
3. Deploy automatically

## 📞 Support

If you encounter any issues:
1. Check the console logs
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Check file permissions

## 🎉 You're All Set!

Your Wedding RSVP backend is now ready to receive guest responses and send automated emails with Excel attachments!