# 🚀 NEXCHAT  
### AI-Powered Real-Time Communication & Control Platform

NEXCHAT is a production-level full-stack communication platform inspired by WhatsApp, designed to deliver secure real-time messaging, audio/video calling, AI-powered translation, and centralized application control.

This project goes beyond a simple chat application and demonstrates scalable architecture, WebRTC communication, secure authentication, third-party integrations, and intelligent automation.

---

# 🌟 Vision

NEXCHAT aims to become a centralized smart communication hub where users can:

- Chat in real time
- Make audio & video calls
- Share media and status updates
- Translate messages automatically
- Control external applications
- Receive intelligent AI-powered assistance

---

# 🔥 Core Features

## 🔐 Secure Authentication
- JWT-based authentication
- HTTP-only cookie storage
- Protected routes
- Middleware-based token verification
- Secure password hashing

---

## 💬 Real-Time Messaging
- One-to-One Chat
- Instant Message Delivery (Socket.io)
- Typing Indicator
- Online/Offline Presence
- Message Seen/Delivered Status
- Emoji Support
- Timestamped Conversations

---

## 📞 Audio & Video Calling
- Real-Time Audio Calls
- Real-Time Video Calls
- WebRTC Peer-to-Peer Communication
- Socket.io Signaling Server
- Incoming Call Popup
- Accept / Reject Call Flow
- Call Disconnect Handling
- Incoming Call Ringtone System

---

## 🔔 Smart Notification System
- Real-Time Message Alerts
- Call Notification Sounds
- Custom Ringtone on Incoming Calls
- Email Notifications (SendGrid)
- SMS Notifications (Twilio)

---

## 📸 Status (Stories) Feature
- Upload Image Status
- 24-Hour Expiry System
- View Contacts' Status
- Real-Time Status Updates

---

## 📁 Media Handling
- Image Upload using Multer
- Cloudinary Cloud Storage Integration
- Optimized Media Delivery

---

## 🌍 Multi-Language Support (Upcoming)
- Real-Time Message Translation
- AI-Based Language Detection
- Automatic Message Conversion
- Multi-Language Chat Experience

---

## 🎛 Centralized App Control System (Upcoming)
- Control external applications via API
- Real-time command execution
- Secure cross-application communication
- Event-driven architecture using WebSockets
- Central Dashboard Capability

---

## 🤖 AI Integration
- OpenAI API Integration
- AI-assisted responses
- Intelligent message handling
- Smart communication enhancement

---

# 🧠 Architecture Highlights

- RESTful API Design
- MVC Backend Structure
- WebSocket Event Architecture
- WebRTC Signaling via Socket.io
- Secure JWT Authentication Flow
- Cloud-Based Media Storage
- Event-Driven Real-Time Communication
- Scalable Backend Design

---

# 🛠 Tech Stack

## 🖥 Frontend
- React 19
- React Router DOM
- Zustand (State Management)
- React Hook Form + Yup (Validation)
- Tailwind CSS + DaisyUI
- Axios
- Framer Motion
- Socket.io Client
- WebRTC

## ⚙ Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Socket.io
- Multer
- Cloudinary
- SendGrid
- Twilio
- OpenAI API
- Cookie Parser
- CORS
- dotenv

---

# 📂 Project Structure

/backend  
   /controllers  
   /models  
   /routes  
   /middlewares  
   /socket  
   index.js  

/frontend  
   /src  
      /components  
      /pages  
      /hooks  
      /store  
      /utils  

---

# ⚙️ Installation Guide

## 1️⃣ Clone Repository

git clone https://github.com/your-username/nexchat.git

---

## 2️⃣ Backend Setup

cd backend  
npm install  
npm run dev  

---

## 3️⃣ Frontend Setup

cd frontend  
npm install  
npm start  

---

# 🔑 Environment Variables (.env)

PORT=5000  
MONGO_URI=your_mongodb_connection_string  
JWT_SECRET=your_secret_key  
CLOUDINARY_CLOUD_NAME=your_cloud_name  
CLOUDINARY_API_KEY=your_api_key  
CLOUDINARY_API_SECRET=your_api_secret  
SENDGRID_API_KEY=your_sendgrid_key  
TWILIO_ACCOUNT_SID=your_sid  
TWILIO_AUTH_TOKEN=your_token  
OPENAI_API_KEY=your_openai_key  

---

# 🔒 Security Features

- Secure JWT Implementation
- Protected API Routes
- Input Validation
- Secure Cookie Handling
- CORS Configuration
- Environment-Based Secrets Management

---

# 🚀 Future Enhancements

- End-to-End Encryption
- Group Video Calls
- Voice Messages
- Message Reactions
- Push Notifications (PWA)
- Docker Deployment
- Microservice Architecture
- CI/CD Integration

---

# 👨‍💻 Author

Deepak Kumar

---

# 🎯 What NEXCHAT Demonstrates

- Advanced Full-Stack MERN Development
- Real-Time Communication Systems
- WebRTC-Based Calling Infrastructure
- AI Integration
- Scalable Backend Architecture
- Cloud & Third-Party API Integration
- Product-Level Thinking & System Design
