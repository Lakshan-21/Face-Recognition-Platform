# Face Recognition Platform

An advanced real-time face recognition system with intelligent detection capabilities and interactive user engagement features.

## Overview

This platform provides a comprehensive face recognition solution that can detect, register, and identify faces in real-time using modern web technologies and machine learning algorithms.

## Features

- **Real-time Face Detection**: Live camera feed with instant face detection
- **Face Registration**: Register new faces with user information
- **Live Recognition**: Identify registered users with confidence scores
- **Interactive Chat Interface**: AI-powered chat system with RAG capabilities
- **Modern UI**: Dark mode interface with responsive design
- **Real-time Statistics**: Track recognition events and system metrics

## Technology Stack

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for responsive styling
- **Wouter** for routing
- **TanStack Query** for state management
- **shadcn/ui** components
- **WebSocket** for real-time updates

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** database with Drizzle ORM
- **WebSocket** for live communication

### Machine Learning
- **Python** face recognition service
- **OpenCV** for image processing
- **face_recognition** library for detection and encoding
- **FAISS** vector database for similarity search

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- Python 3.11
- PostgreSQL database

### 1. Clone the Repository
```bash
git clone <repository-url>
cd face-recognition-platform
```

### 2. Install Dependencies

**Node.js dependencies:**
```bash
npm install
```

**Python dependencies:**
```bash
cd python_service
pip install -r requirements.txt
```

### 3. Database Setup
The project uses PostgreSQL. Ensure you have a PostgreSQL database running and set the `DATABASE_URL` environment variable.

```bash
# Push database schema
npm run db:push
```

### 4. Environment Variables
Create a `.env` file in the root directory:
```
DATABASE_URL=your_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key (optional, for chat features)
```

### 5. Start the Application

**Start the main application:**
```bash
npm run dev
```

**Start the Python face recognition service (in another terminal):**
```bash
cd python_service
python face_recognition_service.py
```

The application will be available at `http://localhost:5000`

## Usage

### Face Registration
1. Navigate to the "Registration" tab
2. Position your face in the camera frame
3. Fill in your personal information (name, department, role)
4. Click "Register Face" to save your profile

   ![Image Alt](https://github.com/Lakshan-21/Face-Recognition-Platform/blob/main/image%20(1).png?raw=true)
   ![Image Alt](https://github.com/Lakshan-21/Face-Recognition-Platform/blob/main/image.png?raw=true)

### Live Recognition
1. Switch to the "Recognition" tab
2. The system will automatically detect and identify registered faces
3. Confidence scores and bounding boxes will be displayed
4. Unknown faces will be labeled as "Unknown"

 ![Image Alt](https://github.com/Lakshan-21/Face-Recognition-Platform/blob/main/image.png?raw=true)
 
### Chat Interface
1. Use the "Chat" tab to interact with the AI system
2. Ask questions about recognition events and system data
3. Get insights about registered users and detection statistics

    ![Image Alt](https://github.com/Lakshan-21/Face-Recognition-Platform/blob/main/image.png?raw=true)

## Project Structure

```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Application pages
│   │   ├── lib/          # Utilities and helpers
│   │   └── hooks/        # Custom React hooks
├── server/               # Express backend
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database operations
│   └── index.ts          # Server entry point
├── python_service/       # Face recognition service
│   ├── face_recognition_service.py
│   └── rag_engine.py
├── shared/               # Shared types and schemas
│   └── schema.ts
└── README.md
```

## API Endpoints

### Face Recognition
- `POST /api/recognize-face` - Recognize faces in uploaded image
- `POST /api/register-face` - Register a new face
- `GET /api/registrations/recent` - Get recent registrations

### Statistics
- `GET /api/recognition-stats` - Get recognition statistics
- `GET /api/recognition-events/recent` - Get recent recognition events
- `GET /api/system/status` - Get system status

### Chat
- `POST /api/chat` - Send chat message to AI system
- `GET /api/chat/history` - Get chat history

## Configuration

### Face Recognition Settings
- **Confidence Threshold**: Adjustable via slider in the Recognition tab
- **Detection Sensitivity**: Configurable in the live recognition interface
- **Bounding Box Display**: Toggle face detection visualizations

### Database Schema
The application uses the following main tables:
- `face_registrations` - Stores registered face data
- `recognition_events` - Logs face recognition events
- `chat_messages` - Stores chat interactions
- `system_logs` - Application logging

## Troubleshooting

### Common Issues

**Camera not working:**
- Ensure camera permissions are granted
- Check if another application is using the camera
- Try refreshing the page

**Face detection not working:**
- Verify the Python service is running
- Check camera lighting conditions
- Ensure face is clearly visible in the frame

**Database connection issues:**
- Verify PostgreSQL is running
- Check DATABASE_URL environment variable
- Run database migrations: `npm run db:push`

**Python service errors:**
- Install required Python packages
- Check Python version compatibility
- Verify camera access permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

This project is a part of a hackathon run by https://katomaran.com
