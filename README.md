# Face Recognition Platform

An advanced real-time face recognition system with intelligent detection capabilities and interactive user engagement features.

## Real-time Deployed Application

Explore the real-time prototype in action: [https://facerecognitionplatform.cc/]

## Overview

This platform provides a comprehensive face recognition solution that can detect, register, and identify faces in real-time using modern web technologies and machine learning algorithms.

## System Architecture

### Platform Overview

The Katomaran Face Recognition Platform follows a modern, layered architecture designed for scalability, performance, and real-time processing capabilities.

![Image Alt](https://github.com/Lakshan-21/Face-Recognition-Platform/blob/main/detailed-project-architecture.jpg?raw=true)

### Architecture Components

**Frontend Layer:**
- React-based user interface with TypeScript for type safety
- Real-time webcam integration and live face detection display
- Responsive design with Twitter blue theming
- WebSocket client for real-time updates

**Backend API Layer:**
- Express.js server with RESTful API endpoints
- Authentication and session management
- WebSocket server for live communication
- Database abstraction layer with type-safe operations

**AI/ML Processing Layer:**
- Python-based face recognition service using industry-standard libraries
- OpenCV for image processing and computer vision tasks
- Face detection, encoding, and comparison algorithms
- RAG (Retrieval-Augmented Generation) engine for intelligent chat responses

**Data Persistence Layer:**
- PostgreSQL database with Drizzle ORM
- Structured data storage for users, face registrations, and events
- Analytics and logging data with efficient indexing
- Automatic data retention and cleanup policies

### Data Flow

1. **Face Registration:** Camera captures image → Frontend processes → API validates → Python service encodes → Database stores
2. **Live Recognition:** Camera stream → Real-time detection → Face comparison → WebSocket broadcast → UI updates
3. **Chat Interface:** User query → RAG engine processes → Context retrieval → Response generation → Display

This architecture ensures high performance, scalability, and maintainability while providing accurate face recognition capabilities and intelligent user interactions.

## Live Demo & Video Walkthrough

### Platform Demonstration

Watch a comprehensive demonstration of the Katomaran Face Recognition Platform in action:

[🎥 View Demo Video](YOUR_VIDEO_LINK_HERE)

See the real-time face recognition system detecting and identifying registered users with high accuracy, the intelligent chat interface responding to queries, and the complete registration workflow from camera capture to database storage.

## Features

- **Real-time Face Detection**: Live camera feed with instant face detection
- **Face Registration**: Register new faces with user information
- **Live Recognition**: Identify registered users with confidence scores
- **Interactive Chat Interface**: AI-powered chat system with RAG capabilities
- **Modern UI**: Dark mode interface with responsive design
- **Real-time Statistics**: Track recognition events and system metrics

## Implementation: Organized Logging in Live Recognition Panel

### Event Tracking and Log Management

The Katomaran Face Recognition Platform includes comprehensive logging capabilities for monitoring and reviewing recognition events in real-time.

#### Logging Features

**Real-time Event Tracking:**
- Face detection events with timestamps
- Recognition accuracy scores and confidence levels
- User identification results (registered vs. unknown)
- System performance metrics and processing times

**Log Categories:**
- **Detection Logs:** Face detection events with bounding box coordinates
- **Recognition Logs:** User identification attempts and results
- **Performance Logs:** Processing times and system resource usage
- **Error Logs:** Failed recognition attempts and system errors
- **Analytics Logs:** Statistical data for recognition patterns

#### Implementation Details

**Database Schema:**
```sql
-- Recognition Events Table
recognition_events (
  id: Primary Key
  person_id: Foreign Key (nullable for unknown faces)
  confidence: Decimal (0.0 - 1.0)
  detection_time: Timestamp
  bbox_coordinates: JSON Array
  is_recognized: Boolean
)

-- System Logs Table
system_logs (
  id: Primary Key
  level: String (INFO, WARNING, ERROR)
  module: String (recognition, detection, api)
  message: Text
  timestamp: Timestamp
  metadata: JSON
)

```
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
   ![Image Alt](https://github.com/Lakshan-21/Face-Recognition-Platform/blob/main/image%20(2).png?raw=true)

### Live Recognition
1. Switch to the "Recognition" tab
2. The system will automatically detect and identify registered faces
3. Confidence scores and bounding boxes will be displayed
4. Unknown faces will be labeled as "Unknown"

   ![Image Alt](https://github.com/Lakshan-21/Face-Recognition-Platform/blob/main/image%20(3).png?raw=true)
   ![Image Alt](https://github.com/Lakshan-21/Face-Recognition-Platform/blob/main/image%20(4).png?raw=true)
 
### Chat Interface
1. Use the "Chat" tab to interact with the AI system
2. Ask questions about recognition events and system data
3. Get insights about registered users and detection statistics

   ![Image Alt](https://github.com/Lakshan-21/Face-Recognition-Platform/blob/main/image%20(5).png?raw=true)
   ![Image Alt](https://github.com/Lakshan-21/Face-Recognition-Platform/blob/main/image%20(6).png?raw=true)

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

## Domain Integration with Cloudflare (.cc)

### Custom Domain Setup

To deploy your Katomaran Face Recognition Platform with a custom .cc domain through Cloudflare:

#### Prerequisites
- Active Cloudflare account
- Custom .cc domain registered
- Deployment platform with custom domain support

#### Setup Steps

1. **Configure DNS in Cloudflare:**
   - Add a CNAME record pointing your domain to your deployment URL
   - Set the record to "Proxied" (orange cloud) for Cloudflare's CDN benefits
   - Example: `your-domain.cc` → `your-app-name.deployment-platform.app`

2. **Update Deployment Settings:**
   - Navigate to your project's deployment configuration
   - Add your custom domain in the "Custom Domains" section
   - Verify domain ownership through the provided verification process

3. **Environment Configuration:**
   ```bash
   # Add to your .env file
   CUSTOM_DOMAIN=your-domain.cc
   ALLOWED_ORIGINS=your-domain.cc,localhost:5000

   
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
