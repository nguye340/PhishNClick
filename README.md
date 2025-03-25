# PhishNClick - Level Up Your Security Skills

PhishNClick is an interactive cybersecurity training platform that turns phishing awareness into an engaging arcade experience. Through gamified learning, users can improve their ability to identify and combat phishing attempts while competing with others globally.

## Features

- **Arcade-Style Learning**: Progress through increasingly difficult security challenges
- **Interactive Assessment**: Initial skill assessment to personalize your learning journey
- **Real-Time Battles**: Challenge friends and colleagues in head-to-head security battles
- **Skill Stats**: Track your progress with detailed performance metrics
- **Global Leaderboards**: Compete for the top spot on global, regional, or company leaderboards

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

- **Frontend**: React.js, TypeScript, Tailwind CSS, Shadcn UI
- **Animations**: GSAP, Framer Motion, Spline
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
