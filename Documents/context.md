# Project Context: Phishing Awareness Training Website

This document outlines the key features, tech stack, and approach for creating an interactive phishing awareness training platform. The goal of this project is to simulate phishing scenarios in a gamified environment to train users, track their progress, and help organizations strengthen their cybersecurity awareness.

## Key Features and Tabs

### 1. **Learning Path**
- **Description**: A visual learning journey similar to Duolingo, where users progress through different levels of phishing awareness.
- **Steps**:
  - Start with a **Phishing Awareness Test** to determine the user's baseline knowledge.
  - **Mini Games**:
    - **Swipe-Based Sorting**: Users classify emails as phishing or legitimate. Similar to the Tinder mechanic, users swipe left for phishing and right for legitimate emails.
    - **Spot the Indicators**: Players highlight red flags in phishing emails. The game is timed, and users have a limited time to collect as many suspicious hints as possible within a message (5 lives).
    - **Phish Frenzy (Kahoot-style)**: Fast-paced multiple-choice quizzes on phishing scenarios.
    - **Cyber Sabotage (Among Us-style)**: Players identify and report phishing attempts within a simulated environment.
- **Progress Tracking**: Show user progress with levels, badges, and unlocked modules.

### 2. **Practice**
- **Description**: A personalized dashboard showing common pitfalls, unlocked modules, and recommended areas for improvement.
- **Details**:
  - **Common Pitfalls**: A report of frequent mistakes users make (e.g., falling for email types like "Password Reset").
  - **Modules**: A list of modules the user has completed and the ones they still need training on.

### 3. **Leaderboard**
- **Description**: A competitive area displaying top users based on their performance.
- **Categories**:
  - **Global Leaderboard**: Rankings of users worldwide.
  - **Regional Leaderboard**: Rankings by region (e.g., North America, Europe).
  - **Organization-Specific**: Rankings based on users within an organization.

### 4. **Cyber Arena (Multiplayer Playground)**
- **Description**: A multiplayer section where users can join games, create custom lobbies, and challenge others in phishing awareness.
- **Tabs**:
  - **Lobby**: Users can create or join lobbies for multiplayer games.
  - **Game Modes**: Various game modes are available, such as Kahoot-style quizzes and Among Us-inspired phishing games.
  - **Community**: A chat/forum area for users to discuss strategies, share experiences, and interact.
  - **Game Types**:
    - **Phish Frenzy**: Fast-paced quiz-style game.
    - **Cyber Sabotage**: Identify and report phishing emails within a simulated environment.

### 5. **Achievements/Shop**
- **Description**: A rewards system to encourage users by offering badges, trophies, and in-game items.
- **Details**:
  - Users earn **badges** for completing certain milestones (e.g., completing all levels of the phishing training).
  - **Shop**: Users can purchase cosmetic upgrades or more training scenarios with in-game points.

### 6. **Progress & Reports**
- **Description**: A detailed report on user performance, phishing scenarios encountered, and areas for improvement.
- **Types of Users and Report Customization**:
  - **Guest User**: Must log in to view detailed reports.
  - **Personal User**: View reports on personal performance, comparison with others, strengths/weaknesses, and recommended training.
  - **Organization/Business User**: Track employees' performance, common phishing types they fall for, and receive alerts about employees needing more practice.
  - **Tester/Developer User**: View click rates, identify areas to improve the games, and track the effectiveness of the phishing scenarios.
- **Reports Includes**:
  - **Phishing Scenario Stats**: Types of phishing the user falls for most often.
  - **Click Rate**: Data on how frequently users interact with phishing emails.
  - **Feedback**: Ability to give feedback on the phishing games to improve the system.

### 7. **Profile/Account**
- **Description**: User account settings and management.
- **Features**:
  - Registered email.
  - **Password Reset**.
  - **Multifactor Authentication (MFA)** (optional).
  - Option to modify **personal information**.

## Tech Stack

The following technologies will be used to build the application:

- **Frontend**: 
  - **React.js**: JavaScript library for building user interfaces.
  - **TypeScript**: Type-safe JavaScript for better maintainability.
  - **Tailwind CSS**: Utility-first CSS framework for fast UI development.
  - **Shadcn UI**: For a component library that integrates seamlessly with Tailwind for advanced UI components.

- **Backend**: 
  - **Node.js**: JavaScript runtime for building server-side applications.
  - **Express.js**: Web framework for building APIs.
  - **MongoDB**: NoSQL database to store user data, game statistics, phishing scenarios, and reports.
  - **Mongoose**: ODM for MongoDB to manage database interactions.

- **Optional/Additional**: 
  - **Spline**: For 3D components or game elements (e.g., visualizing phishing scenarios).
  - **GSAP**: For animations (e.g., to animate phishing indicators in emails or during training).
  
## Generating Phishing Email Content

To generate phishing email content, we can use both **AI models** and **phishing databases** with APIs. Here’s the approach:

### **1. AI-Generated Phishing Content**
Using AI models such as OpenAI’s GPT, we can generate phishing email templates. 
- **AI Approach**: 
  - Use prompts to generate realistic phishing emails targeting different user roles and scenarios. Example:
    - "Generate a phishing email pretending to be from PayPal, asking users to reset their password due to unusual activity."
  - The model can generate different phishing scenarios like credential harvesting, malicious attachments, or business email compromise.

- **Backend API Implementation**: 
  - **Node.js** (Express.js) backend to query the OpenAI API and generate phishing emails.
  - Store generated emails in **MongoDB** for future use and training purposes.
  - Display the phishing email scenarios dynamically during the games.

### **2. Using a Phishing Database API**
Phishing database APIs like **PhishTank**, **OpenPhish**, and **AbuseIPDB** can provide real-world phishing examples.
- **Steps**: 
  - Query the phishing database to retrieve phishing email templates or known malicious URLs.
  - Integrate this data into the backend to populate real phishing scenarios in the game.
  - Use **MongoDB** to store these scenarios and track user interactions.

### **Hybrid Approach**:
- Combine AI-generated phishing content and real phishing data to create a robust set of phishing scenarios.
- **Personalization**: Adapt the training based on the user's previous mistakes (e.g., more training on password phishing if the user struggles with those scenarios).

## Key Considerations

- **Data Privacy**: Ensure user data privacy and security through encryption, authentication, and compliance with data protection laws.
- **Scalability**: Design the system to support growing numbers of users, scenarios, and game data.
- **User Engagement**: Implement gamification (leaderboards, achievements) to keep users motivated.
- **Feedback Loop**: Include a feedback mechanism for continuous improvement of the training content and phishing scenarios.
- **Mobile Responsiveness**: The platform should be fully responsive and accessible on a variety of devices, ensuring ease of use for all users.

---

This document provides a comprehensive overview of the project, detailing the core features, technology stack, and considerations for generating phishing email content dynamically. The goal is to create an engaging, interactive platform that helps users become more aware of phishing threats while allowing organizations to monitor and improve their employees' cybersecurity awareness.
