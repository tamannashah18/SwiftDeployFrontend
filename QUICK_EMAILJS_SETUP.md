# Quick EmailJS Setup - 5 Minutes

## Step 1: Sign Up (1 minute)
1. Go to: https://www.emailjs.com/
2. Click "Sign Up" (top right)
3. Sign up with Google (easiest) or email
4. Verify your email if needed

## Step 2: Add Gmail Service (2 minutes)
1. In EmailJS dashboard, click **"Email Services"** (left sidebar)
2. Click **"Add New Service"** button
3. Select **"Gmail"**
4. Click **"Connect Account"**
5. Sign in with: **swift.deploy.app@gmail.com**
6. Allow permissions
7. Click **"Create Service"**
8. **COPY the Service ID** (looks like: `service_abc123`)

## Step 3: Create Template (1 minute)
1. Click **"Email Templates"** (left sidebar)
2. Click **"Create New Template"**
3. Fill in:
   - **Template Name:** `SwiftDeploy Support`
   - **Subject:** `SwiftDeploy Support Query - {{subject}}`
   - **Content:**
   ```
   New Support Query Received

   From: {{from_name}}
   Email: {{from_email}}

   Message:
   {{message}}

   ---
   Reply to: {{reply_to}}
   ```
4. Click **"Save"**
5. **COPY the Template ID** (looks like: `template_xyz789`)

## Step 4: Get Public Key (30 seconds)
1. Click **"Account"** → **"General"** (left sidebar)
2. Scroll to **"API Keys"** section
3. **COPY the Public Key** (looks like: `abc123xyz456`)

## Step 5: Update Code (30 seconds)
1. Open: `src/Pages/HelpSupport.jsx`
2. Find lines 13-17 (the EMAILJS_CONFIG object)
3. Replace with your actual values:

```javascript
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_abc123',      // Paste your Service ID here
  TEMPLATE_ID: 'template_xyz789',    // Paste your Template ID here
  PUBLIC_KEY: 'abc123xyz456'          // Paste your Public Key here
};
```

## Step 6: Test
1. Save the file
2. Refresh your browser
3. Go to Help & Support page
4. Enter a test query
5. Click "Send Query"
6. Check swift.deploy.app@gmail.com inbox!

## Done! ✅

Your emails will now be sent directly to swift.deploy.app@gmail.com without opening any mail app.

