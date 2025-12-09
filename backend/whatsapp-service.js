// whatsapp-service.js - WhatsApp Integration using Meta WhatsApp Business API
const axios = require('axios');

// Meta WhatsApp API Configuration
const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';
const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

// Send simple text message
async function sendWhatsAppTextMessage(phoneNumber, message) {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: {
          preview_url: true,
          body: message
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Text message sent to ${formattedPhone}: ${response.data.messages[0].id}`);
    
    return {
      success: true,
      messageId: response.data.messages[0].id,
      phoneNumber: formattedPhone
    };
    
  } catch (error) {
    console.error('Error sending text message:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      phoneNumber: phoneNumber
    };
  }
}

// Generate unique RSVP link
function generateRSVPLink(guestId, guestName) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const encodedName = encodeURIComponent(guestName);
  return `${baseUrl}/rsvp?id=${guestId}&name=${encodedName}`;
}

// Format phone number for WhatsApp (must include country code without +)
function formatPhoneNumber(phoneNumber) {
  // Remove any spaces, dashes, or special characters
  let cleaned = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
  
  // If number doesn't start with country code, add India code (91)
  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  return cleaned;
}

// Send WhatsApp invitation using Meta API
async function sendWhatsAppInvitation(phoneNumber, guestName, weddingDetails) {
  try {
    // Generate unique link for this guest
    const guestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const rsvpLink = generateRSVPLink(guestId, guestName);
    
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    // Create invitation message
    const messageBody = `🎉 *Wedding Invitation* 🎉

Dear ${guestName},

You are cordially invited to celebrate the wedding of:

*${weddingDetails.brideName} & ${weddingDetails.groomName}*

📅 Date: ${weddingDetails.date}
🕐 Time: ${weddingDetails.time}
📍 Venue: ${weddingDetails.venue}

Please RSVP by clicking the link below:
${rsvpLink}

We look forward to celebrating with you! 💕

With love,
${weddingDetails.coupleName}`;

    // Send message using Meta WhatsApp Business API
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: {
          preview_url: true,
          body: messageBody
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`WhatsApp invitation sent to ${guestName} (${formattedPhone}): ${response.data.messages[0].id}`);
    
    return {
      success: true,
      messageId: response.data.messages[0].id,
      guestId: guestId,
      rsvpLink: rsvpLink,
      phoneNumber: formattedPhone
    };
    
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      phoneNumber: phoneNumber
    };
  }
}

// Send WhatsApp invitation with template message (recommended for production)
async function sendWhatsAppTemplateInvitation(phoneNumber, guestName, templateName = 'wedding_invitation', templateLanguage = 'en') {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: templateLanguage
          },
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "text",
                  text: guestName  // your variable goes here
                }
              ]
            }
            // DO NOT add body parameters because your body has 0 variables
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log(`✅ Template sent successfully to ${guestName}: ${response.data.messages[0].id}`);

    return {
      success: true,
      messageId: response.data.messages[0].id,
      guestName,
      phoneNumber: formattedPhone
    };

  } catch (error) {
    console.error(`❌ Error sending template to ${guestName}:`, error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      guestName,
      phoneNumber
    };
  }
}

// Send bulk invitations with rate limiting
async function sendBulkInvitations(guestList, weddingDetails, useTemplate = false) {
  const results = [];
  const batchSize = 5; // Send 5 messages at a time
  const delayBetweenBatches = 2000; // 2 seconds delay between batches
  
  for (let i = 0; i < guestList.length; i += batchSize) {
    const batch = guestList.slice(i, i + batchSize);
    
    const batchPromises = batch.map(guest => 
      useTemplate 
        ? sendWhatsAppTemplateInvitation(guest.phoneNumber, guest.name, weddingDetails)
        : sendWhatsAppInvitation(guest.phoneNumber, guest.name, weddingDetails)
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach((result, index) => {
      results.push({
        guest: batch[index].name,
        phone: batch[index].phoneNumber,
        ...result
      });
    });
    
    // Add delay between batches to respect rate limits
    if (i + batchSize < guestList.length) {
      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}, waiting before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  return results;
}

// Send RSVP confirmation
async function sendRSVPConfirmation(phoneNumber, guestName, attending) {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    let message;
    if (attending === 'yes') {
      message = `Thank you ${guestName}! 🎉\n\nWe're delighted you'll be joining us for our special day. We'll send you more details soon!\n\nWith love ❤️`;
    } else if (attending === 'maybe') {
      message = `Thank you for your response, ${guestName}! 🤔\n\nWe understand you're not sure yet. Please update your RSVP when you've decided. We hope to see you there!\n\nWith love ❤️`;
    } else {
      message = `Thank you for letting us know, ${guestName}.\n\nWe'll miss you at our celebration, but we appreciate your response.\n\nWith love ❤️`;
    }
    
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Confirmation sent to ${guestName}: ${response.data.messages[0].id}`);
    return { 
      success: true, 
      messageId: response.data.messages[0].id 
    };
    
  } catch (error) {
    console.error('Error sending confirmation:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error?.message || error.message 
    };
  }
}

// Send media message (image/video invitation)
async function sendMediaInvitation(phoneNumber, mediaUrl, caption, mediaType = 'image') {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: mediaType, // 'image', 'video', 'document'
        [mediaType]: {
          link: mediaUrl,
          caption: caption
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Media message sent to ${formattedPhone}: ${response.data.messages[0].id}`);
    return { 
      success: true, 
      messageId: response.data.messages[0].id 
    };
    
  } catch (error) {
    console.error('Error sending media message:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error?.message || error.message 
    };
  }
}

// Verify webhook (for receiving messages from users)
function verifyWebhook(mode, token, challenge) {
  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'your_verify_token';
  
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      return challenge;
    } else {
      return null;
    }
  }
  return null;
}

// Handle incoming webhook messages
function handleWebhookMessage(body) {
  try {
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry[0];
      const changes = entry.changes[0];
      const value = changes.value;
      
      if (value.messages && value.messages[0]) {
        const message = value.messages[0];
        const from = message.from;
        const messageBody = message.text?.body || '';
        const messageId = message.id;
        const timestamp = message.timestamp;
        
        // Try to get contact name if available
        let contactName = 'Unknown';
        if (value.contacts && value.contacts[0]) {
          const contact = value.contacts[0];
          contactName = contact.profile?.name || contact.wa_id || 'Unknown';
        }
        
        console.log(`📨 Message from ${contactName} (${from}): ${messageBody}`);
        
        return {
          from,
          name: contactName,
          messageBody,
          messageId,
          timestamp,
          type: message.type
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error handling webhook message:', error);
    return null;
  }
}

module.exports = {
  sendWhatsAppInvitation,
  sendWhatsAppTemplateInvitation,
  sendBulkInvitations,
  sendRSVPConfirmation,
  sendMediaInvitation,
  sendWhatsAppTextMessage,
  generateRSVPLink,
  verifyWebhook,
  handleWebhookMessage
};
