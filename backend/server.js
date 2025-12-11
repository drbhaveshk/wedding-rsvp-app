// server.js - Main Backend Server (with Google Drive)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');

const { 
  sendWhatsAppInvitation,
  sendWhatsAppTemplateInvitation,
  sendRSVPConfirmation,
  sendMediaInvitation,
  sendWhatsAppTextMessage,
  verifyWebhook,
  handleWebhookMessage 
} = require('./whatsapp-service');

const {
  uploadToGoogleDrive,
  updateFileInGoogleDrive,
  findFileByName,
  makeFilePublic
} = require('./google-drive-service');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let dir = './uploads/aadhar';
    
    if (req.path.includes('invitation')) {
      dir = './uploads/invitations';
    }
    
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// In-memory storage - separated by wedding
let rsvpData = {
  wedding1: [],
  wedding2: [],
  wedding3: []
};
let serialNumbers = {
  wedding1: 1,
  wedding2: 1,
  wedding3: 1
};
let incomingMessages = [];
let googleDriveFileIds = {
  wedding1: null,
  wedding2: null,
  wedding3: null
};

// Excel file configuration
const getExcelFileName = (weddingId) => `wedding-rsvp-data-${weddingId}.xlsx`;
const getExcelFilePath = (weddingId) => path.join(__dirname, getExcelFileName(weddingId));
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || null;

// Initialize Excel file
async function initializeExcel(weddingId = 'wedding1') {
  try {
    const filePath = getExcelFilePath(weddingId);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("RSVP Responses");

    worksheet.columns = [
      { header: "S.No", key: "serialNo", width: 10 },
      { header: "Guest Name", key: "guestName", width: 25 },
      { header: "Number of Guests", key: "numberOfGuests", width: 18 },
      { header: "Arrival Date", key: "arrivalDate", width: 15 },
      { header: "Departure Date", key: "departureDate", width: 15 },
      { header: "Attending", key: "attending", width: 15 },
      { header: "Aadhar Document Paths", key: "aadharDocuments", width: 50 },
      { header: "Submission Time", key: "timestamp", width: 25 },
      { header: "Aadhar Images", key: "images", width: 20 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" }
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thick', color: { argb: 'FF000000' } },
        left: { style: 'thick', color: { argb: 'FF000000' } },
        bottom: { style: 'thick', color: { argb: 'FF000000' } },
        right: { style: 'thick', color: { argb: 'FF000000' } }
      };
    });

    await workbook.xlsx.writeFile(filePath);
    console.log(`✅ Excel file initialized successfully for ${weddingId}`);
  } catch (error) {
    console.error(`❌ Error initializing Excel for ${weddingId}:`, error);
  }
}

// Update Excel file with new data
async function updateExcel(data, weddingId) {
  try {
    const filePath = getExcelFilePath(weddingId);
    console.log(`📊 Starting Excel update for ${weddingId}:`, data.guestName);
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet('RSVP Responses');
    
    if (!worksheet) {
      console.error('❌ Worksheet "RSVP Responses" not found!');
      return false;
    }

    const lastRowNum = worksheet.lastRow ? worksheet.lastRow.number : 1;
    const newRowNum = lastRowNum + 1;

    console.log(`📝 Adding data to row ${newRowNum}`);

    const newRow = worksheet.getRow(newRowNum);
    newRow.getCell(1).value = data.serialNo;
    newRow.getCell(2).value = data.guestName;
    newRow.getCell(3).value = data.numberOfGuests;
    newRow.getCell(4).value = data.arrivalDate || 'Not Provided';
    newRow.getCell(5).value = data.departureDate || 'Not Provided';
    newRow.getCell(6).value = data.attending;
    newRow.getCell(7).value = data.aadharPaths.join(', ');
    newRow.getCell(8).value = data.timestamp;
    newRow.getCell(9).value = 'See images →';

    newRow.commit();

    console.log(`✅ Row ${newRowNum} data set`);

    newRow.height = 100;
    newRow.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      cell.font = { size: 11 };
    });

    if (data.aadharPaths && data.aadharPaths.length > 0) {
      console.log(`🖼️ Adding ${data.aadharPaths.length} images`);
      
      for (let i = 0; i < data.aadharPaths.length; i++) {
        const imgPath = data.aadharPaths[i];
        const ext = path.extname(imgPath).slice(1).toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) {
          try {
            const imageId = workbook.addImage({
              filename: imgPath,
              extension: ext
            });

            worksheet.addImage(imageId, {
              tl: { col: 8 + (i * 0.35), row: newRowNum - 1 + (i * 0.01) },
              ext: { width: 90, height: 90 }
            });

            console.log(`  ✅ Image ${i + 1} added successfully`);
          } catch (imgErr) {
            console.log(`  ⚠️ Could not add image ${i + 1}:`, imgErr.message);
          }
        }
      }
    }

    await workbook.xlsx.writeFile(filePath);
    console.log(`✅ Excel file saved successfully for ${weddingId}`);
    
    return true;

  } catch (err) {
    console.error(`❌ Excel update error for ${weddingId}:`, err);
    return false;
  }
}

// Upload Excel file to Google Drive
async function uploadExcelToDrive(weddingId) {
  try {
    const fileName = getExcelFileName(weddingId);
    const filePath = getExcelFilePath(weddingId);
    
    console.log(`\n📤 Uploading Excel to Google Drive for ${weddingId}...`);
    
    // Check if file already exists in Drive
    const existingFile = await findFileByName(fileName, GOOGLE_DRIVE_FOLDER_ID);
    
    let result;
    
    if (existingFile.success && existingFile.file) {
      // Update existing file
      console.log('📝 File exists, updating...');
      result = await updateFileInGoogleDrive(existingFile.file.id, filePath);
      googleDriveFileIds[weddingId] = existingFile.file.id;
    } else {
      // Upload new file
      console.log('📤 Creating new file...');
      result = await uploadToGoogleDrive(
        filePath, 
        fileName, 
        GOOGLE_DRIVE_FOLDER_ID
      );
      
      if (result.success) {
        googleDriveFileIds[weddingId] = result.fileId;
        
        // Make file publicly accessible
        await makeFilePublic(result.fileId);
      }
    }
    
    if (result.success) {
      console.log(`✅ Google Drive upload successful for ${weddingId}!`);
      console.log('🔗 View Link:', result.webViewLink);
      return result;
    } else {
      console.error(`❌ Google Drive upload failed for ${weddingId}:`, result.error);
      return result;
    }
    
  } catch (error) {
    console.error(`❌ Error uploading to Drive for ${weddingId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Wedding RSVP Backend is running',
    timestamp: new Date().toISOString(),
    whatsappConfigured: !!(process.env.META_PHONE_NUMBER_ID && process.env.META_ACCESS_TOKEN),
    googleDriveConfigured: !!(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is reachable',
    cors: 'enabled'
  });
});

// Submit RSVP
app.post('/api/rsvp/submit', upload.array('aadharFiles', 10), async (req, res) => {
  try {
    const { guestName, arrivalDate, departureDate, numberOfGuests, attending, aadharImages } = req.body;
    
    console.log('\n📝 ===== NEW RSVP SUBMISSION =====');
    console.log('Guest Name:', guestName);
    console.log('Number of Guests:', numberOfGuests);
    
    // Validate mandatory fields
    if (!guestName || !numberOfGuests || !attending) {
      console.log('❌ Validation failed: Missing mandatory fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing mandatory fields: guestName, numberOfGuests, or attending' 
      });
    }
    
    // Process uploaded files
    let aadharPaths = [];
    
    if (req.files && req.files.length > 0) {
      aadharPaths = req.files.map(file => file.path);
      console.log('📁 Files uploaded via multipart:', aadharPaths);
    } else if (aadharImages) {
      try {
        let images = [];
        
        if (typeof aadharImages === 'string') {
          images = JSON.parse(aadharImages);
        } else if (Array.isArray(aadharImages)) {
          images = aadharImages;
        } else {
          console.error('❌ Invalid aadharImages format:', typeof aadharImages);
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid Aadhar images format' 
          });
        }
        
        await fs.mkdir('./uploads/aadhar', { recursive: true });
        
        console.log(`💾 Processing ${images.length} base64 images...`);
        
        for (let i = 0; i < images.length; i++) {
          const base64Data = images[i].replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const filename = `${Date.now()}-${i}-aadhar.jpg`;
          const filepath = path.join(__dirname, 'uploads', 'aadhar', filename);
          await fs.writeFile(filepath, buffer);
          aadharPaths.push(filepath);
          console.log(`  ✅ Saved image ${i + 1}: ${filepath}`);
        }
      } catch (parseError) {
        console.error('❌ Error parsing aadhar images:', parseError);
        return res.status(400).json({ 
          success: false, 
          message: 'Error processing Aadhar images',
          error: parseError.message 
        });
      }
    }
    
    if (aadharPaths.length === 0 && (attending === 'yes' || attending === 'maybe')) {
      console.log('❌ Validation failed: No Aadhar documents uploaded for attending guest');
      return res.status(400).json({ 
        success: false, 
        message: 'At least one Aadhar document is required if you are attending or might attend' 
      });
    }
    
    // Create RSVP entry
    const rsvpEntry = {
      serialNo: serialNumber++,
      guestName: guestName,
      numberOfGuests: numberOfGuests ? parseInt(numberOfGuests) : 0,
      arrivalDate: arrivalDate || null,
      departureDate: departureDate || null,
      attending: attending,
      aadharPaths: aadharPaths,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };
    
    console.log('\n📋 RSVP Entry Created:');
    console.log(JSON.stringify(rsvpEntry, null, 2));
    
    // Store in memory
    rsvpData.push(rsvpEntry);
    console.log(`📊 Total RSVPs in memory: ${rsvpData.length}`);
    
    // Update Excel file
    console.log('\n📊 Updating Excel file...');
    const excelUpdated = await updateExcel(rsvpEntry);
    if (!excelUpdated) {
      console.error('❌ Failed to update Excel file');
    } else {
      console.log('✅ Excel file updated successfully');
    }
    
    // Upload to Google Drive
    console.log('\n☁️ Uploading to Google Drive...');
    const driveResult = await uploadExcelToDrive();
    if (!driveResult.success) {
      console.error('❌ Failed to upload to Google Drive:', driveResult.error);
    } else {
      console.log('✅ Successfully uploaded to Google Drive');
    }
    
    console.log('\n🎉 RSVP SUBMISSION COMPLETE - Serial No:', rsvpEntry.serialNo);
    console.log('===================================\n');
    
    res.json({ 
      success: true, 
      message: 'RSVP submitted successfully',
      serialNo: rsvpEntry.serialNo,
      driveLink: driveResult.success ? driveResult.webViewLink : null
    });
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR processing RSVP:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing RSVP',
      error: error.message 
    });
  }
});

// Get all RSVPs (with wedding filter)
app.get('/api/rsvp/all', async (req, res) => {
  try {
    const { weddingId } = req.query;
    
    if (weddingId && ['wedding1', 'wedding2', 'wedding3'].includes(weddingId)) {
      res.json({ 
        success: true, 
        data: rsvpData[weddingId],
        count: rsvpData[weddingId].length,
        weddingId: weddingId
      });
    } else {
      // Return all weddings
      res.json({ 
        success: true, 
        data: rsvpData,
        counts: {
          wedding1: rsvpData.wedding1.length,
          wedding2: rsvpData.wedding2.length,
          wedding3: rsvpData.wedding3.length,
          total: rsvpData.wedding1.length + rsvpData.wedding2.length + rsvpData.wedding3.length
        }
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching RSVPs',
      error: error.message 
    });
  }
});

// Get statistics (with wedding filter)
app.get('/api/rsvp/stats', async (req, res) => {
  try {
    const { weddingId } = req.query;
    
    if (weddingId && ['wedding1', 'wedding2', 'wedding3'].includes(weddingId)) {
      const data = rsvpData[weddingId];
      const attending = data.filter(r => r.attending === 'yes').length;
      const maybe = data.filter(r => r.attending === 'maybe').length;
      const notAttending = data.filter(r => r.attending === 'no').length;
      
      res.json({ 
        success: true, 
        weddingId: weddingId,
        stats: {
          total: data.length,
          attending,
          maybe,
          notAttending
        }
      });
    } else {
      // Return stats for all weddings
      const allStats = {};
      ['wedding1', 'wedding2', 'wedding3'].forEach(wid => {
        const data = rsvpData[wid];
        allStats[wid] = {
          total: data.length,
          attending: data.filter(r => r.attending === 'yes').length,
          maybe: data.filter(r => r.attending === 'maybe').length,
          notAttending: data.filter(r => r.attending === 'no').length
        };
      });
      
      res.json({ 
        success: true, 
        stats: allStats
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching stats',
      error: error.message 
    });
  }
});

// Download Excel file (with wedding filter)
app.get('/api/rsvp/download', async (req, res) => {
  try {
    const { weddingId } = req.query;
    const validWeddingId = ['wedding1', 'wedding2', 'wedding3'].includes(weddingId) ? weddingId : 'wedding1';
    const filePath = getExcelFilePath(validWeddingId);
    const fileName = getExcelFileName(validWeddingId);
    
    res.download(filePath, fileName);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error downloading file',
      error: error.message 
    });
  }
});

// Get Google Drive link (with wedding filter)
app.get('/api/rsvp/drive-link', async (req, res) => {
  try {
    const { weddingId } = req.query;
    const validWeddingId = ['wedding1', 'wedding2', 'wedding3'].includes(weddingId) ? weddingId : 'wedding1';
    
    if (googleDriveFileIds[validWeddingId]) {
      const driveLink = `https://drive.google.com/file/d/${googleDriveFileIds[validWeddingId]}/view`;
      res.json({
        success: true,
        weddingId: validWeddingId,
        driveLink: driveLink,
        fileId: googleDriveFileIds[validWeddingId]
      });
    } else {
      res.json({
        success: false,
        weddingId: validWeddingId,
        message: `No file uploaded to Drive yet for ${validWeddingId}`
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting Drive link',
      error: error.message
    });
  }
});

// Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  const result = verifyWebhook(mode, token, challenge);
  
  if (result) {
    res.status(200).send(result);
  } else {
    res.sendStatus(403);
  }
});

// Webhook handler
app.post('/webhook', (req, res) => {
  try {
    const msg = handleWebhookMessage(req.body);

    if (msg) {
      console.log("Received WhatsApp message:", msg);

      incomingMessages.unshift({
        name: msg.name || 'Unknown',
        phoneNumber: msg.from || 'Unknown',
        messageBody: msg.messageBody || msg.message || msg.text || '',
        timestamp: msg.timestamp ? Number(msg.timestamp) * 1000 : Date.now(),
        messageId: msg.messageId || `msg_${Date.now()}`
      });

      if (incomingMessages.length > 100) {
        incomingMessages = incomingMessages.slice(0, 100);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    res.sendStatus(500);
  }
});

// Send WhatsApp Invitation with optional media
app.post('/api/whatsapp/send-invitation', upload.single('invitationFile'), async (req, res) => {
  try {
    const { phoneNumber, guestName, message } = req.body;

    if (!phoneNumber || !guestName || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: phoneNumber, guestName, message'
      });
    }

    let result;

    if (req.file) {
      const mediaUrl = `${process.env.FRONTEND_URL}/uploads/invitations/${req.file.filename}`;
      const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'document';
      result = await sendMediaInvitation(phoneNumber, mediaUrl, message, mediaType);
    } else {
      result = await sendWhatsAppTextMessage(phoneNumber, message);
    }

    res.json(result);

  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending WhatsApp invitation',
      error: error.message
    });
  }
});

// Send WhatsApp Template Invitation
app.post('/api/whatsapp/send-template-invitation', async (req, res) => {
  try {
    const { phoneNumber, guestName, templateName, templateLanguage } = req.body;

    if (!phoneNumber || !guestName || !templateName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: phoneNumber, guestName, templateName'
      });
    }

    const result = await sendWhatsAppTemplateInvitation(
      phoneNumber,
      guestName,
      templateName,
      templateLanguage || 'en'
    );

    return res.json(result);

  } catch (error) {
    console.error("Error sending template invitation:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send RSVP confirmation
app.post('/api/whatsapp/send-confirmation', async (req, res) => {
  try {
    const { phoneNumber, guestName, attending } = req.body;
    
    if (!phoneNumber || !guestName || !attending) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const result = await sendRSVPConfirmation(phoneNumber, guestName, attending);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending confirmation',
      error: error.message
    });
  }
});

// GET incoming WhatsApp messages
app.get('/api/whatsapp/incoming-messages', (req, res) => {
  res.set('Cache-Control', 'no-store');

  try {
    console.log(`📨 Fetching messages. Total stored: ${incomingMessages.length}`);
    
    return res.json({
      success: true,
      messages: incomingMessages
    });
  } catch (error) {
    console.error("Error fetching incoming messages:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message
    });
  }
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize Excel files for all three weddings
    await initializeExcel('wedding1');
    await initializeExcel('wedding2');
    await initializeExcel('wedding3');
    
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log('🎉 Wedding RSVP Backend Server Started');
      console.log('='.repeat(50));
      console.log(`🌐 Port: ${PORT}`);
      console.log(`📱 WhatsApp: ${!!(process.env.META_PHONE_NUMBER_ID && process.env.META_ACCESS_TOKEN) ? 'Configured' : 'Not Configured'}`);
      console.log(`☁️  Google Drive: ${!!(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || process.env.GOOGLE_SERVICE_ACCOUNT_KEY) ? 'Configured' : 'Not Configured'}`);
      console.log(`💒 Weddings: 3 separate events configured`);
      console.log('='.repeat(50) + '\n');
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

startServer();
