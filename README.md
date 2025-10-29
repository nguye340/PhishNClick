# PhishNClick Cyber Awareness Training Website

<div align="center">
  
[![Visit Website](https://img.shields.io/badge/🎮_Visit_Website-app.catphishlabs.ca-00D9FF?style=for-the-badge&labelColor=000000)](https://app.catphishlabs.ca/)

</div>

PhishNClick is an interactive cybersecurity training platform that turns phishing awareness into an engaging arcade experience. Through gamified learning, users can improve their ability to identify and combat phishing attempts while having fun.

## Features

### Diverse Mini-Game Training Modules
Four unique arcade-style games that teach different aspects of cybersecurity:

#### Popup Manic
Identify and handle malicious popups in a Windows-like environment with draggable windows, taskbar management, and educational feedback.

![Popup Manic](screenshots/popup-manic4.png)

#### Phish404
A side-scrolling arcade game where you jump over phishing attempts and collect power-ups while avoiding cyber threats.

![Phish404](screenshots/phish404-2.png)

#### PhishHunt
Duck Hunt-style game for spotting phishing attempts. Shoot the malicious emails before they escape!

![PhishHunt](screenshots/phishhunt4.png)

#### Hooked or Cooked
Analyze email content and make quick security decisions. Catch the legitimate emails and avoid the phishing bait.

![Hooked or Cooked](screenshots/hooked-or-cooked.png)

### User Authentication & Registration
Secure authentication system with multiple options:
- Email/password registration and login
- Google OAuth integration
- GitHub OAuth integration
- Account lockout protection after failed attempts

![User Login](screenshots/UserLogin.png)
![User Registration](screenshots/UserRegistration.png)

### Comprehensive User Dashboard
Track your cybersecurity learning progress with detailed analytics:
- Overall security score and risk level
- Category-specific performance metrics
- Game-by-game statistics
- Progress tracking over time
- Personalized recommendations

![User Dashboard 1](screenshots/UserDashboard1.png)
![User Dashboard 2](screenshots/UserDashboard2.png)
![User Dashboard 3](screenshots/UserDashboard3.png)
![User Dashboard 4](screenshots/UserDashboard4.png)

### Admin Dashboard
Powerful administrative tools for organizations:
- User risk assessment and scoring
- Detailed user progress tracking
- Category weakness identification
- Bulk user management
- Account unlock capabilities
- Organization-wide analytics

![Admin Dashboard](screenshots/admin-dashboard-full.png)
![User Risk Details](screenshots/admin-dashboard-user-progress-and-risk-details.png)

## Project Structure

The project is organized as a full-stack application with separate frontend and backend directories:

```
PhishNClick/
├── frontend/             # Next.js frontend application
│   ├── public/           # Static assets
│   └── src/              # React components and pages
│       ├── app/          # Next.js app router
│       ├── components/   # Reusable components
│       │   ├── assessment/  # Assessment-related components
│       │   ├── rive/     # Rive character animation components
│       │   └── ui/       # UI components including GameDialogue
│       └── styles/       # Global styles
│
└── backend/              # Express.js backend application
    ├── server.js         # Main server entry point
    └── package.json      # Backend dependencies
```

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/phishnclick.git
cd phishnclick
```

2. Install all dependencies (frontend, backend, and root):
```bash
npm run install:all
```

3. Set up environment variables:
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` with your configuration values.

4. Start the development servers (both frontend and backend):
```bash
npm run dev
```

This will start the frontend on http://localhost:3000 and the backend on http://localhost:5000.

## Running Separately

- To run only the frontend: `npm run frontend:dev`
- To run only the backend: `npm run backend:dev`
- To build the frontend: `npm run frontend:build`
- To start in production mode: `npm run start`

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Shadcn UI
- **Animations**: Framer Motion, GSAP
- **3D Graphics**: Spline, Rive
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Audio**: Howler.js

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: JavaScript (ES Modules)
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Security**: CORS, express-rate-limit, cookie-parser
- **File Upload**: Multer

### DevOps & Deployment
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Registry**: Docker Hub
- **Hosting**: AWS EC2
- **Reverse Proxy**: Application Load Balancer (ALB)
- **SSL**: AWS Certificate Manager

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
