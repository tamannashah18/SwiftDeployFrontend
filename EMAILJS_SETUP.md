# EmailJS Setup Guide for Help & Support

This guide will help you set up EmailJS to send emails directly from the Help & Support page to `swift.deploy.app@gmail.com`.

## Step 1: Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account (free tier allows 200 emails/month)

## Step 2: Add Email Service

1. Go to **Email Services** in the dashboard
2. Click **Add New Service**
3. Choose **Gmail** (since you're using Gmail)
4. Connect your Gmail account (`swift.deploy.app@gmail.com`)
5. Click **Create Service**
6. **Copy the Service ID** (you'll need this)

## Step 3: Create Email Template

1. Go to **Email Templates** in the dashboard
2. Click **Create New Template**
3. Use this template:

**Template Name:** SwiftDeploy Support Query

**Subject:** SwiftDeploy Support Query - {{subject}}

**Content:**
```
Hello SwiftDeploy Support Team,

You have received a new support query:

From: {{from_name}} ({{from_email}})

Query/Issue:
{{message}}

---
Reply to: {{reply_to}}
```

4. Click **Save**
5. **Copy the Template ID** (you'll need this)

## Step 4: Get Public Key

1. Go to **Account** → **General**
2. Find **Public Key** section
3. **Copy the Public Key** (you'll need this)

## Step 5: Update HelpSupport.jsx

Open `src/Pages/HelpSupport.jsx` and replace these values:

1. Line 14: Replace `'YOUR_PUBLIC_KEY'` with your actual Public Key
2. Line 48: Replace `'YOUR_SERVICE_ID'` with your Service ID
3. Line 49: Replace `'YOUR_TEMPLATE_ID'` with your Template ID
4. Line 50: Replace `'YOUR_PUBLIC_KEY'` with your Public Key again

## Example:

```javascript
emailjs.init('abc123xyz'); // Your Public Key

// In handleSubmit:
await emailjs.send(
  'service_abc123',      // Your Service ID
  'template_xyz789',     // Your Template ID
  templateParams,
  'abc123xyz'            // Your Public Key
);
```

## Step 6: Test

1. Start your frontend: `npm start`
2. Navigate to Help & Support page
3. Enter a test query
4. Click "Send Query"
5. Check `swift.deploy.app@gmail.com` inbox for the email

## Troubleshooting

- **Error: "Invalid Public Key"**: Make sure you copied the Public Key correctly
- **Error: "Service not found"**: Verify your Service ID is correct
- **Error: "Template not found"**: Verify your Template ID is correct
- **Email not received**: Check spam folder, verify Gmail connection in EmailJS dashboard

## Free Tier Limits

- 200 emails per month (free tier)
- Upgrade if you need more emails

