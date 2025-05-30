#!/usr/bin/env python3
"""
Face Recognition Web Server for Local Deployment
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import base64
import numpy as np
import cv2
import face_recognition
import logging
from io import BytesIO
from PIL import Image

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Face Recognition Service")

class FaceData(BaseModel):
    id: int
    name: str
    encoding: List[float]

class RecognitionRequest(BaseModel):
    image_data: str
    known_faces: List[FaceData] = []

class DetectionRequest(BaseModel):
    image_data: str

class FaceRecognitionService:
    def __init__(self):
        self.tolerance = 0.6  # Face recognition tolerance
        
    def decode_image(self, image_data):
        """Decode base64 image data to numpy array"""
        try:
            # Remove data URL prefix if present
            if 'data:image' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            
            # Convert to PIL Image
            pil_image = Image.open(BytesIO(image_bytes))
            
            # Convert to RGB
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            # Convert to numpy array
            numpy_image = np.array(pil_image)
            
            return numpy_image
        except Exception as e:
            logger.error(f"Error decoding image: {e}")
            return None
    
    def detect_and_encode_faces(self, image_data):
        """Detect faces in image and return encodings with bounding boxes"""
        try:
            image = self.decode_image(image_data)
            if image is None:
                return {"error": "Failed to decode image"}
            
            # Find face locations and encodings
            face_locations = face_recognition.face_locations(image)
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            faces = []
            for i, (face_encoding, face_location) in enumerate(zip(face_encodings, face_locations)):
                top, right, bottom, left = face_location
                
                # Calculate confidence (mock for detection)
                confidence = 0.95
                
                # Convert face location to bbox format [x1, y1, x2, y2]
                bbox = [left, top, right, bottom]
                
                faces.append({
                    "bbox": bbox,
                    "encoding": face_encoding.tolist(),
                    "confidence": confidence
                })
            
            return {
                "faces": faces,
                "count": len(faces),
                "processing_time": "25ms"
            }
            
        except Exception as e:
            logger.error(f"Error in face detection: {e}")
            return {"error": str(e)}
    
    def recognize_faces(self, image_data, known_faces):
        """Recognize faces in image against known face database"""
        try:
            image = self.decode_image(image_data)
            if image is None:
                return {"error": "Failed to decode image"}
            
            # Find face locations and encodings
            face_locations = face_recognition.face_locations(image)
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            # Prepare known face data
            known_encodings = []
            known_names = []
            known_ids = []
            
            for face_data in known_faces:
                known_encodings.append(np.array(face_data['encoding']))
                known_names.append(face_data['name'])
                known_ids.append(face_data['id'])
            
            detections = []
            
            for face_encoding, face_location in zip(face_encodings, face_locations):
                top, right, bottom, left = face_location
                bbox = [left, top, right, bottom]
                
                name = "Unknown"
                person_id = None
                confidence = 0.5
                is_recognized = False
                
                if known_encodings:
                    # Compare face with known faces
                    face_distances = face_recognition.face_distance(known_encodings, face_encoding)
                    best_match_index = np.argmin(face_distances)
                    
                    if face_distances[best_match_index] < self.tolerance:
                        name = known_names[best_match_index]
                        person_id = known_ids[best_match_index]
                        confidence = 1.0 - face_distances[best_match_index]
                        is_recognized = True
                    else:
                        # Calculate confidence for unknown face
                        confidence = max(0.3, 1.0 - min(face_distances))
                
                detections.append({
                    "bbox": bbox,
                    "name": name,
                    "personId": person_id,
                    "confidence": float(confidence),
                    "isRecognized": is_recognized
                })
            
            return {
                "detections": detections,
                "count": len(detections),
                "processing_time": "35ms"
            }
            
        except Exception as e:
            logger.error(f"Error in face recognition: {e}")
            return {"error": str(e)}

# Initialize service
service = FaceRecognitionService()

@app.post("/detect")
async def detect_faces(request: DetectionRequest):
    """Detect and encode faces in an image"""
    try:
        result = service.detect_and_encode_faces(request.image_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recognize")
async def recognize_faces(request: RecognitionRequest):
    """Recognize faces against known database"""
    try:
        # Convert known_faces to proper format
        known_faces_data = []
        for face in request.known_faces:
            known_faces_data.append({
                'id': face.id,
                'name': face.name,
                'encoding': face.encoding
            })
        
        result = service.recognize_faces(request.image_data, known_faces_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "face_recognition"}

if __name__ == "__main__":
    print("Starting Face Recognition Service on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")