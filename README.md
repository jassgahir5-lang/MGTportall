# 🎓 MGTportal - Campus Event Management Portal

A full-stack, responsive event management system designed for campus events. It allows administrators to create and manage events, track registrations, and export attendee lists, while providing students/users with seamless event registration, profile management, and ticket passes.

---

## ✨ Features

### 👤 User / Student Portal
- **Authentication**: Secure sign-up and login with password hashing (`bcryptjs`) and session management.
- **Event Discovery & Registration**: Browse upcoming campus events and register with a single click.
- **Registration Management**: View your registered events and cancel registrations if plans change.
- **Profile Settings**: Update personal details and change account passwords securely.

### 🛡️ Admin Dashboard
- **Overview & Analytics**: View total events, total attendees, and registration trends at a glance.
- **Event Creation & Management**: Create new events with details like date, time, venue, and descriptions.
- **Attendee Tracking**: Real-time list of students registered for each event.
- **CSV Export**: Export attendee lists directly to CSV for attendance tracking and reporting.
- **Event Moderation**: Delete or modify existing events.

---

## 🛠️ Tech Stack

- **Backend**: Node.js & Express.js
- **Frontend / Templating**: EJS (Embedded JavaScript templates) & Custom Responsive CSS
- **Database**: PostgreSQL (hosted on Supabase) via `pg`
- **Authentication & Security**: `express-session`, `bcryptjs`, `express-validator`
- **File Uploads & Assets**: `multer`
- **Passes & Reporting**: `pdfkit`, `qrcode`
- **Mailing**: `nodemailer`

---

## 📁 Project Structure

```text
MGTportal/
├── config/             # Database connection & configurations
├── controllers/        # Route logic (auth, admin, user controllers)
├── middleware/         # Auth verification and role checks
├── public/
│   ├── css/            # Stylesheets
│   └── js/             # Client-side scripts
├── routes/             # Express routes (authRoutes, adminRoutes, userRoutes)
├── uploads/            # Uploaded files and media
├── views/              # EJS templates (auth, admin, user dashboards)
├── .env.example        # Environment variable template
├── .gitignore          # Git ignore rules (node_modules, .env)
├── package.json        # Dependencies and scripts
└── server.js           # Express app entry point
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- PostgreSQL database (or a free [Supabase](https://supabase.com/) project)

### 2. Clone the Repository
```bash
git clone https://github.com/jassgahir5-lang/MGTportall.git
cd MGTportall
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Environment Variables
Create a `.env` file in the root directory (you can copy `.env.example`):
```bash
cp .env.example .env
```

Fill in your configuration:
```env
PORT=3000
SESSION_SECRET=your_secret_key_here
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
```

### 5. Run the Application

**Development mode (auto-reload on changes):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Visit the app in your browser at: `http://localhost:3000`

---

## 🔒 Security Notice
Sensitive credentials such as database passwords and session keys are never tracked in Git. Always use `.env` locally or configure Environment Variables in your hosting provider's dashboard.

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).
