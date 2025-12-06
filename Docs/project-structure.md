# Wedding RSVP App - Complete File Structure

## 📁 Project Structure

```
wedding-rsvp-app/
├── backend/
│   ├── server.js
│   ├── whatsapp-service.js
│   ├── database.js
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   └── uploads/
│       ├── aadhar/
│       └── invitations/
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── RSVPForm.js
│   │   │   └── AdminPanel.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   ├── .env
│   └── .gitignore
│
└── README.md
```

## 🚀 How to Create the Project

### Step 1: Create Backend

```bash
# Create project folder
mkdir wedding-rsvp-app
cd wedding-rsvp-app

# Create backend folder
mkdir backend
cd backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express cors multer nodemailer exceljs dotenv axios mongoose

# Install dev dependencies
npm install --save-dev nodemon
```

### Step 2: Create Frontend

```bash
# Go back to root
cd ..

# Create React app
npx create-react-app frontend

# Install additional dependencies
cd frontend
npm install lucide-react xlsx
```

### Step 3: Copy Files

I'll provide all the file contents below. Copy each file to the appropriate location.

---

## 📝 Backend Files

### `backend/package.json`
```json
{
  "name": "wedding-rsvp-backend",
  "version": "1.0.0",
  "description": "Backend server for Wedding RSVP application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": ["wedding", "rsvp", "backend"],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.7",
    "exceljs": "^4.4.0",
    "dotenv": "^16.3.1",
    "axios": "^1.6.2",
    "mongoose": "^8.0.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### `backend/.env.example`
```env
# Server Configuration
PORT=3001

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Notification Email (where you want to receive RSVP updates)
NOTIFICATION_EMAIL=wedding-organizer@example.com

# WhatsApp API (Meta/Facebook)
META_PHONE_NUMBER_ID=your-phone-number-id
META_ACCESS_TOKEN=your-access-token
META_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token

# Database (if using MongoDB)
MONGODB_URI=mongodb://localhost:27017/wedding-rsvp

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### `backend/.gitignore`
```
node_modules/
.env
uploads/
*.xlsx
*.log
.DS_Store
```

### `backend/server.js`
_Copy the server.js code from the artifact I created earlier_

### `backend/whatsapp-service.js`
_Copy the whatsapp-service.js code from the artifact I created earlier_

### `backend/database.js`
_Copy the database.js code from the artifact I created earlier_

---

## 📝 Frontend Files

### `frontend/package.json`
Add to the existing package.json after creating React app:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "lucide-react": "^0.263.1",
    "xlsx": "^0.18.5"
  }
}
```

### `frontend/.env`
```env
REACT_APP_API_URL=http://localhost:3001
```

### `frontend/.gitignore`
```
node_modules/
build/
.env
.env.local
.DS_Store
```

### `frontend/public/index.html`
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#ec4899" />
    <meta name="description" content="Wedding RSVP App" />
    <title>Wedding RSVP</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

### `frontend/src/App.js`
```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RSVPForm from './components/RSVPForm';
import AdminPanel from './components/AdminPanel';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RSVPForm />} />
        <Route path="/rsvp" element={<RSVPForm />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
```

### `frontend/src/index.js`
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### `frontend/src/index.css`
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
```

### `frontend/src/components/RSVPForm.js`
_Copy the RSVPForm component code from the wedding-rsvp-app artifact_

### `frontend/src/components/AdminPanel.js`
_Copy the AdminPanel component code from the admin-panel artifact_

---

## 📖 Root README.md

```markdown
# Wedding RSVP Application

A complete wedding invitation and RSVP management system with WhatsApp integration.

## Features

- 📱 WhatsApp invitation sending with Meta Business API
- 📊 Excel-based guest list management
- 💌 Customized messages for each guest
- 📎 Invitation card attachment (JPG/PNG/PDF)
- 📋 RSVP form with Aadhar document upload
- 📧 Automated email notifications
- 📈 Real-time tracking and statistics
- 👨‍💼 Admin panel for managing guests

## Quick Start

### Backend Setup

1. Navigate to backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Fill in your credentials in `.env`

5. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open browser at http://localhost:3000

## Access Points

- **RSVP Form**: http://localhost:3000/rsvp
- **Admin Panel**: http://localhost:3000/admin
- **Backend API**: http://localhost:3001/api

## Documentation

- See `META_WHATSAPP_SETUP.md` for WhatsApp API setup
- See `SETUP_INSTRUCTIONS.md` for detailed setup guide

## Tech Stack

- **Frontend**: React, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express
- **Database**: MongoDB (optional)
- **APIs**: Meta WhatsApp Business API, Gmail SMTP
- **File Processing**: ExcelJS, Multer

## License

MIT
```

---

## 💾 How to Download/Create the Zip File

### Method 1: Manual Creation (Recommended)

1. Create the folder structure as shown above
2. Copy all the code from my artifacts into the respective files
3. Right-click the `wedding-rsvp-app` folder
4. Select "Compress" or "Send to → Compressed folder"

### Method 2: Using Command Line

```bash
# Create everything
mkdir -p wedding-rsvp-app/{backend/{uploads/{aadhar,invitations}},frontend/src/components}

# After copying all files, create zip
cd ..
zip -r wedding-rsvp-app.zip wedding-rsvp-app/
```

### Method 3: Using Git (Best Practice)

```bash
cd wedding-rsvp-app
git init
git add .
git commit -m "Initial commit"

# Then download as ZIP from GitHub or:
git archive -o wedding-rsvp-app.zip HEAD
```

---

## ✅ Checklist Before Zipping

- [ ] All backend files copied (server.js, whatsapp-service.js, database.js, package.json)
- [ ] All frontend files copied (RSVPForm.js, AdminPanel.js, App.js, index.js)
- [ ] .env.example files included (but NOT .env with real credentials)
- [ ] .gitignore files included
- [ ] README.md included
- [ ] Documentation files included
- [ ] package.json files are correct

---

## 🚀 After Unzipping

```bash
# Unzip the file
unzip wedding-rsvp-app.zip
cd wedding-rsvp-app

# Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev

# In new terminal, setup frontend
cd frontend
npm install
npm start
```

Your app will be running at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
```
