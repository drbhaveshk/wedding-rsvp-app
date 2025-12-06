# Meta WhatsApp Business API Setup Guide

## 🚀 Complete Setup Instructions for Meta WhatsApp Business API

### Prerequisites
- Facebook Business Account
- Meta Developer Account
- Verified Business Phone Number
- A website/app with HTTPS for webhooks

---

## Step 1: Create Meta Developer Account

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **"Get Started"** and create an account
3. Verify your email address

---

## Step 2: Create a Meta App

1. Go to [Meta Apps Dashboard](https://developers.facebook.com/apps)
2. Click **"Create App"**
3. Select **"Business"** as app type
4. Fill in app details:
   - **App Name**: Wedding RSVP App
   - **Contact Email**: Your email
   - **Business Account**: Select or create one
5. Click **"Create App"**

---

## Step 3: Add WhatsApp Product

1. In your app dashboard, find **"WhatsApp"** in the products list
2. Click **"Set Up"**
3. Select or create a **Business Portfolio**
4. Choose **"Business Account"** or create new one

---

## Step 4: Configure WhatsApp Business API

### A. Get Temporary Access Token (Testing)

1. Go to **WhatsApp > API Setup** in your app
2. In the "Send and receive messages" section:
   - You'll see a **Temporary Access Token** (valid for 24 hours)
   - Copy this token for testing
3. Note the **Phone Number ID** (displays above the token)
4. You'll see a test number provided by Meta

### B. Add Test Phone Numbers

1. Scroll to **"To"** section
2. Click **"Add phone number"**
3. Enter your phone number with country code (e.g., +919876543210)
4. Verify with OTP sent to your phone
5. You can add up to 5 test numbers

### C. Test Sending a Message

```bash
curl -X POST \
  "https://graph.facebook.com/v21.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919876543210",
    "type": "text",
    "text": {
      "body": "Hello! This is a test message from Wedding RSVP App."
    }
  }'
```

---

## Step 5: Get Permanent Access Token (Production)

### A. Create a System User

1. Go to **Business Settings** in Facebook Business Manager
2. Click **"Users" > "System Users"**
3. Click **"Add"** and create a system user:
   - **Name**: Wedding RSVP System User
   - **Role**: Admin
4. Click **"Create System User"**

### B. Generate Permanent Token

1. Click on the system user you just created
2. Click **"Generate New Token"**
3. Select your app
4. Select permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Click **"Generate Token"**
6. **IMPORTANT**: Copy this token immediately - you won't see it again!
7. Save it securely in your `.env` file

---

## Step 6: Add Your Business Phone Number

### Option A: Use Meta's Test Number (Temporary)
- Limited to 5 recipients
- Good for testing only
- No verification needed

### Option B: Add Your Own Phone Number (Production)

1. Go to **WhatsApp > API Setup**
2. Click **"Add phone number"**
3. Verify your business phone number
4. Complete business verification:
   - Business name
   - Business address
   - Business documents
5. Wait for approval (usually 1-3 business days)

---

## Step 7: Configure Webhooks (Receive Messages)

### A. Setup Webhook URL

1. Deploy your backend to a server with HTTPS (Heroku, Railway, Render)
2. Create a webhook endpoint in your backend (already in code)
3. Your webhook URL will be: `https://your-domain.com/webhook`

### B. Configure in Meta

1. Go to **WhatsApp > Configuration** in your app
2. Click **"Edit"** next to Webhook
3. Enter:
   - **Callback URL**: `https://your-domain.com/webhook`
   - **Verify Token**: Your custom token (set in `.env` as `META_WEBHOOK_VERIFY_TOKEN`)
4. Click **"Verify and Save"**

### C. Subscribe to Webhook Fields

1. After webhook is verified, click **"Manage"**
2. Subscribe to:
   - `messages` (for incoming messages)
   - `message_status` (for delivery status)

---

## Step 8: Configure Environment Variables

Update your `.env` file:

```env
# Meta WhatsApp Business API
META_PHONE_NUMBER_ID=123456789012345
META_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
META_WEBHOOK_VERIFY_TOKEN=your_custom_verify_token_123
```

### Where to find these values:

- **META_PHONE_NUMBER_ID**: 
  - WhatsApp > API Setup
  - Found in the "Phone number ID" field
  
- **META_ACCESS_TOKEN**: 
  - For testing: Temporary token from API Setup page
  - For production: System user permanent token
  
- **META_WEBHOOK_VERIFY_TOKEN**: 
  - Create your own secure random string
  - Use this when configuring webhooks

---

## Step 9: Create Message Templates (Recommended)

For production, you should use approved message templates:

### A. Create a Template

1. Go to **WhatsApp > Message Templates**
2. Click **"Create Template"**
3. Fill in template details:

```
Template Name: wedding_invitation
Category: UTILITY
Language: English

Header: Hello {{1}}!

Body: 
You are cordially invited to celebrate the wedding of:

*{{1}} & {{2}}*

📅 Date: {{3}}
🕐 Time: {{4}}
📍 Venue: {{5}}

Please RSVP by clicking the button below.

We look forward to celebrating with you! 💕

Button: RSVP Now [URL]
Button URL: https://your-domain.com/rsvp?id={{1}}
```

4. Submit for approval (usually approved within 24 hours)

### B. Use Template in Code

Once approved, use the template function in `whatsapp-service.js`:

```javascript
await sendWhatsAppTemplateInvitation(
  phoneNumber,
  guestName,
  weddingDetails,
  'wedding_invitation'
);
```

---

## Step 10: Testing Your Integration

### Test Script

```javascript
const { sendWhatsAppInvitation } = require('./whatsapp-service');

const weddingDetails = {
  brideName: 'Priya',
  groomName: 'Rahul',
  date: '15th February 2025',
  time: '6:00 PM',
  venue: 'Grand Hotel, Mumbai',
  coupleName: 'Priya & Rahul'
};

// Test with your verified number
sendWhatsAppInvitation('+919876543210', 'Test Guest', weddingDetails)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));
```

---

## 📊 Rate Limits & Best Practices

### Rate Limits (Meta WhatsApp)
- **Messaging limit tiers**: Start at 250 messages/day
- Increases automatically based on quality rating
- Can reach up to 100,000+ messages/day

### Best Practices
1. **Use Templates**: Required for first message to users
2. **24-hour window**: After user replies, you can send free-form messages for 24 hours
3. **Quality Rating**: Maintain high quality to increase limits
4. **Opt-in**: Ensure users have opted in to receive messages
5. **Batch sending**: Send in batches with delays (already implemented)

---

## 🔒 Security Best Practices

1. **Never expose your access token**
   ```javascript
   // ❌ Wrong
   const token = 'EAAxxxxxxxxxxxxx';
   
   // ✅ Correct
   const token = process.env.META_ACCESS_TOKEN;
   ```

2. **Verify webhook signatures**
   - Verify that requests to your webhook are from Meta
   - Validate the `x-hub-signature-256` header

3. **Use HTTPS only**
   - Meta requires HTTPS for webhooks
   - Use SSL certificates (Let's Encrypt is free)

4. **Rotate tokens regularly**
   - Generate new tokens every few months
   - Update your environment variables

---

## 🐛 Common Issues & Solutions

### Issue 1: "Invalid Phone Number"
**Solution**: Ensure phone number includes country code without + or spaces
- ✅ Correct: `919876543210`
- ❌ Wrong: `+91 98765 43210`

### Issue 2: "Message Not Delivered"
**Solution**: 
- Verify recipient's number is registered on WhatsApp
- Check if number is on test list (for development)
- Ensure you have available messaging limit

### Issue 3: "Access Token Invalid"
**Solution**:
- Temporary tokens expire in 24 hours
- Generate permanent token via System User
- Verify token has correct permissions

### Issue 4: "Webhook Verification Failed"
**Solution**:
- Ensure your server is accessible via HTTPS
- Verify that `META_WEBHOOK_VERIFY_TOKEN` matches in both places
- Check server logs for errors

### Issue 5: "Template Not Found"
**Solution**:
- Ensure template is approved
- Use exact template name (case-sensitive)
- Wait 5-10 minutes after approval before using

---

## 📈 Moving to Production

### Production Checklist

- [ ] Business Verification completed
- [ ] Own phone number added and verified
- [ ] Permanent access token generated
- [ ] Message templates created and approved
- [ ] Webhook configured and verified
- [ ] HTTPS enabled on your domain
- [ ] Rate limits understood
- [ ] Privacy policy added to Facebook Business
- [ ] Terms of service published
- [ ] Error handling implemented
- [ ] Logging and monitoring setup

---

## 📞 Useful Links

- [Meta WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Meta Business Help Center](https://www.facebook.com/business/help)
- [WhatsApp Business Platform Pricing](https://developers.facebook.com/docs/whatsapp/pricing)
- [API Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference)
- [Message Templates Guide](https://developers.facebook.com/docs/whatsapp/message-templates)

---

## 💰 Pricing (As of 2024)

### Free Tier
- First 1,000 conversations per month: **FREE**
- Includes business-initiated and user-initiated conversations

### Paid (After Free Tier)
- Business-initiated: ~₹0.50 - ₹2.00 per conversation (varies by country)
- User-initiated: FREE
- Template approvals: FREE

**Note**: Check latest pricing on Meta's pricing page as rates vary by region.

---

## 🎉 You're Ready!

Your Meta WhatsApp Business API is now configured and ready to send wedding invitations!

For questions or issues, refer to Meta's official documentation or contact their support.