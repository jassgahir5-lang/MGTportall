# 🎓 MGTportal - Campus Event Management Portal

A full-stack, responsive event management system designed for campus events. It allows administrators to create and manage events, track registrations, and export attendee lists, while providing students/users with seamless event registration, profile management, and ticket passes.

---

## ✨ Features

### 👤 User / Student Portal
- **Robust Student Onboarding**: Select from all 12 academic departments with full mobile/desktop cross-browser compatibility.
- **Dynamic Event Discovery**: Live search bar and categorized filters (Technical, Cultural, Sports, Workshops, Management).
- **Comprehensive Event Details & Guidelines**: Deep-dive modals showing event agendas, timings, seat utilization, venue maps, and eligibility perks.
- **Real-Time Cryptographic QR Passes**: High-resolution scannable QR tokens dynamically generated for every issued student entry permit.
- **Profile & Credential Management**: Update legal display names, academic department assignments, and security passwords.

### 🛡️ Admin Command Center
- **Executive Analytics & Metrics**: Total events, enrolled students, active registrations, occupancy fill rate, and category breakdowns.
- **Event Studio & Publishing**: Schedule new events with venue capacities, poster banners, and category tagging.
- **Full Event Editing & Status Moderation**: Modify schedules, venues, capacities, and switch event status (`Upcoming`, `Live Now`, `Completed`, `Cancelled`).
- **Real-Time Gate Attendance Scanner**: 1-click verified check-in for registered student QR passes with live attendance counters.
- **Student Directory & Moderation**: Review all registered student profiles, audited departments, and toggle account access (Active / Suspended).
- **Roster Export**: Download CSV student entry manifests with token IDs, check-in status, and timestamps.
- **Safe Cascading Deletion**: Clean removal of events and all associated passes without database constraint errors.

---

## 🔑 Quick Showcase Credentials
| Role | Email | Password |
|---|---|---|
| **System Admin** | `admin@college.edu` | `admin123` |
| **Enrolled Student** | `jazz@edu.in` | `student123` |
*(1-click auto-fill buttons are also available directly on the login screen!)*

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
