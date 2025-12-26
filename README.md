# 🤖 AI Outreach Agent

A comprehensive AI-powered contact outreach system that automates SMS, voice calls, and email campaigns using Claude AI, Twilio, and Next.js.

## 🌐 Live Demo

**Production URL:** https://agentic-24f342be.vercel.app

## ✨ Features

### 📊 Excel/CSV Contact Management
- Upload and parse Excel (.xlsx) or CSV files
- Automatic data validation and cleaning
- Duplicate detection
- Support for custom variables
- Error reporting for invalid contacts

### 🎯 Multi-Channel Outreach
- **SMS**: Automated text messaging via Twilio
- **Voice Calls**: AI-generated speech with conversational flows
- **Email**: SMTP-based email campaigns

### 🧠 AI-Powered Personalization
- Claude AI generates personalized messages
- Template-based system with variable substitution
- Multiple tone options: sales, support, reminder, follow-up
- Multilingual support

### 🌍 Timezone-Aware Scheduling
- Respects business hours (9 AM - 5 PM local time)
- Automatic timezone detection
- Skip contacts outside business hours

### 💬 Intelligent Response Handling
- Automatic intent classification (interested, not interested, ask later, unsubscribe)
- Suggested automated replies
- Human escalation when needed

### 📞 Advanced Call Features
- Text-to-speech for outbound calls
- Speech-to-text for responses
- Voicemail detection
- Call recording
- Dynamic call flow based on responses

## 📋 Contact Data Format

Your Excel/CSV file should contain these columns:

| Column | Required | Description |
|--------|----------|-------------|
| Full Name | ✅ | Contact's full name |
| Phone Number | ⚠️* | Phone number (E.164 format recommended) |
| Email Address | ⚠️* | Email address |
| Country | ❌ | Country name |
| Time Zone | ❌ | IANA timezone (e.g., America/New_York) |
| Preferred Contact Method | ❌ | SMS, Call, Email, or Auto |
| Status | ❌ | New, Contacted, Replied, Do Not Contact |
| Custom Variables | ❌ | Any additional columns for personalization |

*At least one contact method (Phone or Email) is required

### Example Data

```csv
Full Name,Phone Number,Email Address,Country,Time Zone,Preferred Contact Method,Status,Company
John Doe,+12025551234,john@example.com,USA,America/New_York,SMS,New,Acme Corp
Jane Smith,+442071234567,jane@example.com,UK,Europe/London,Email,New,Tech Inc
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- Twilio account (for SMS/Voice)
- SMTP email account (for Email)
- Anthropic API key (for Claude AI)

### Environment Variables

Create a `.env` file:

```bash
# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_api_key

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Application
NEXT_PUBLIC_APP_URL=https://agentic-24f342be.vercel.app
```

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
open http://localhost:3000
```

### Deploy to Vercel

```bash
# Deploy to production
vercel deploy --prod

# Or use the automated script
npm run deploy
```

## 🎮 Usage

### 1. Upload Contacts
- Click "Upload Excel/CSV File"
- Select your contact list file
- Review validation results (valid, invalid, duplicates)

### 2. Configure Campaign
- **Message Template**: Use variables like `{{firstName}}`, `{{name}}`, and custom fields
- **Tone**: Select sales, support, reminder, or follow-up
- **Language**: Specify the language for messages
- **Business Hours**: Enable to respect contact timezones

### 3. Launch Campaign
- Click "🚀 Launch Campaign"
- Monitor real-time progress
- View results for each contact

## 🔧 API Endpoints

### POST /api/parse-excel
Upload and parse Excel/CSV file
```bash
curl -X POST https://agentic-24f342be.vercel.app/api/parse-excel \
  -F "file=@contacts.xlsx"
```

### POST /api/launch-campaign
Start outreach campaign (Server-Sent Events)
```bash
curl -X POST https://agentic-24f342be.vercel.app/api/launch-campaign \
  -H "Content-Type: application/json" \
  -d '{"contacts": [...], "config": {...}}'
```

### POST /api/webhooks/sms-reply
Twilio webhook for SMS replies
```
Configure in Twilio Console:
https://agentic-24f342be.vercel.app/api/webhooks/sms-reply
```

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js UI    │
│  (React + TSX)  │
└────────┬────────┘
         │
┌────────▼────────┐
│   API Routes    │
│  (Server-Side)  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│ Excel│  │ AI   │
│Parser│  │Agent │
└───┬──┘  └──┬───┘
    │        │
┌───▼────────▼───┐
│ Outreach Engine│
└───┬────────┬───┘
    │        │
┌───▼──┐ ┌──▼──┐ ┌──▼──┐
│ SMS  │ │Voice│ │Email│
│Twilio│ │Twilio│ │SMTP │
└──────┘ └─────┘ └─────┘
```

## 📦 Key Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Claude AI (Anthropic)**: Message generation and intent analysis
- **Twilio**: SMS and voice call infrastructure
- **Nodemailer**: Email sending
- **xlsx**: Excel/CSV parsing
- **Zod**: Runtime type validation

## 🛡️ Compliance Features

- **Do Not Contact** list support
- Automatic unsubscribe handling
- Business hours enforcement
- Rate limiting (2-second delay between contacts)
- Audit trail of all communications

## 🔐 Security

- Environment variables for sensitive credentials
- Server-side API key handling
- No client-side credential exposure
- Webhook signature verification (recommended for production)

## 📈 Campaign Analytics

Track key metrics:
- Total contacts processed
- Successful deliveries
- Failed attempts
- Response rates
- Channel distribution

## 🐛 Troubleshooting

### Common Issues

**"No phone number provided"**
- Ensure phone numbers are in E.164 format (+1234567890)

**"Failed to send SMS"**
- Verify Twilio credentials
- Check phone number is verified in Twilio (trial accounts)

**"Outside business hours"**
- Disable timezone enforcement or update contact timezones

**Build errors**
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (18+ required)

## 📝 License

MIT License - Feel free to use for commercial projects

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📧 Support

For questions or issues:
- GitHub Issues: [Create Issue](https://github.com/your-repo/issues)
- Email: support@example.com

---

**Built with ❤️ using Claude AI, Twilio, and Next.js**
