# Email Setup Instructions

To enable password reset emails, you need to configure Gmail SMTP credentials.

## Step 1: Get a Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable it if not already enabled)
3. Go to **Security** → **App passwords**
4. Select:
   - App: **Mail**
   - Device: **Other (Custom name)**
   - Name: **HomeConnect**
5. Click **Generate**
6. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

## Step 2: Create .env.local file

Create a file named `.env.local` in the root of your project with the following content:

```env
# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password-here
GMAIL_HOST=smtp.gmail.com
GMAIL_PORT=587
GMAIL_FROM=HomeConnect <your-email@gmail.com>
```

**Important:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `your-16-character-app-password-here` with the App Password you generated (remove spaces)
- Use the App Password, NOT your regular Gmail password

## Step 3: Restart Your Development Server

After creating/updating the `.env.local` file, restart your Next.js development server:

```bash
# Stop the server (Ctrl+C)
# Then restart it
npm run dev
```

## Troubleshooting

### Email not received?

1. **Check the server console** - Look for error messages when you try to reset password
2. **Check spam folder** - Emails might go to spam
3. **Verify credentials** - Make sure you're using the App Password, not your regular password
4. **Check 2-Step Verification** - App Passwords only work if 2-Step Verification is enabled

### Common Errors

- **"Email service is not configured"** - Your `.env.local` file is missing or credentials are not set
- **"Gmail authentication failed"** - Your App Password is incorrect
- **"Cannot connect to Gmail SMTP server"** - Network/firewall issue or wrong host/port

### Testing Email Configuration

After setting up, try the forgot password flow. Check your server console for any error messages. If emails are being sent successfully, you'll see:
```
Gmail SMTP connection verified successfully
Password reset email dispatched successfully
```

