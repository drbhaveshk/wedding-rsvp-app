// database.js - MongoDB Database Schema and Connection
const mongoose = require('mongoose');

// Connect to MongoDB
async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-rsvp', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Guest Schema
const guestSchema = new mongoose.Schema({
  guestId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  invitationSent: {
    type: Boolean,
    default: false
  },
  invitationSentAt: {
    type: Date
  },
  whatsappMessageId: {
    type: String
  },
  rsvpLink: {
    type: String
  }
}, {
  timestamps: true
});

// RSVP Response Schema
const rsvpSchema = new mongoose.Schema({
  serialNo: {
    type: Number,
    required: true,
    unique: true
  },
  guestId: {
    type: String,
    required: true
  },
  guestName: {
    type: String,
    required: true,
    trim: true
  },
  numberOfGuests: {
    type: Number,
    required: true,
    min: 1
  },
  arrivalDate: {
    type: String
  },
  departureDate: {
    type: String
  },
  attending: {
    type: String,
    enum: ['yes', 'maybe', 'no'],
    required: true
  },
  aadharDocuments: {
    type: [String],
    default: []
  },
  phoneNumber: {
    type: String
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  dietaryRestrictions: {
    type: String
  },
  specialRequests: {
    type: String
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Wedding Details Schema
const weddingSchema = new mongoose.Schema({
  brideName: {
    type: String,
    required: true
  },
  groomName: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  venueAddress: {
    type: String
  },
  coupleName: {
    type: String
  }
}, {
  timestamps: true
});

// Create models
const Guest = mongoose.model('Guest', guestSchema);
const RSVP = mongoose.model('RSVP', rsvpSchema);
const Wedding = mongoose.model('Wedding', weddingSchema);

// Helper function to get next serial number
async function getNextSerialNumber() {
  const lastRSVP = await RSVP.findOne().sort({ serialNo: -1 });
  return lastRSVP ? lastRSVP.serialNo + 1 : 1;
}

// Save RSVP to database
async function saveRSVP(rsvpData) {
  try {
    const serialNo = await getNextSerialNumber();
    const rsvp = new RSVP({
      ...rsvpData,
      serialNo
    });
    await rsvp.save();
    return { success: true, data: rsvp };
  } catch (error) {
    console.error('Error saving RSVP:', error);
    return { success: false, error: error.message };
  }
}

// Get all RSVPs
async function getAllRSVPs() {
  try {
    const rsvps = await RSVP.find().sort({ serialNo: 1 });
    return { success: true, data: rsvps };
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    return { success: false, error: error.message };
  }
}

// Get RSVP statistics
async function getRSVPStats() {
  try {
    const total = await RSVP.countDocuments();
    const attending = await RSVP.countDocuments({ attending: 'yes' });
    const maybe = await RSVP.countDocuments({ attending: 'maybe' });
    const notAttending = await RSVP.countDocuments({ attending: 'no' });
    
    return {
      success: true,
      stats: {
        total,
        attending,
        maybe,
        notAttending,
        responseRate: total > 0 ? ((total / (await Guest.countDocuments())) * 100).toFixed(2) : 0
      }
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { success: false, error: error.message };
  }
}

// Save guest to database
async function saveGuest(guestData) {
  try {
    const guest = new Guest(guestData);
    await guest.save();
    return { success: true, data: guest };
  } catch (error) {
    console.error('Error saving guest:', error);
    return { success: false, error: error.message };
  }
}

// Get all guests
async function getAllGuests() {
  try {
    const guests = await Guest.find().sort({ name: 1 });
    return { success: true, data: guests };
  } catch (error) {
    console.error('Error fetching guests:', error);
    return { success: false, error: error.message };
  }
}

// Save wedding details
async function saveWeddingDetails(weddingData) {
  try {
    const wedding = new Wedding(weddingData);
    await wedding.save();
    return { success: true, data: wedding };
  } catch (error) {
    console.error('Error saving wedding details:', error);
    return { success: false, error: error.message };
  }
}

// Get wedding details
async function getWeddingDetails() {
  try {
    const wedding = await Wedding.findOne().sort({ createdAt: -1 });
    return { success: true, data: wedding };
  } catch (error) {
    console.error('Error fetching wedding details:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  connectDatabase,
  Guest,
  RSVP,
  Wedding,
  saveRSVP,
  getAllRSVPs,
  getRSVPStats,
  saveGuest,
  getAllGuests,
  saveWeddingDetails,
  getWeddingDetails
};
