#!/usr/bin/env python3
"""
Face Recognition Service for Katomaran Hackathon Platform
Handles face detection, encoding, and recognition using face_recognition library
"""

import sys
import json
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

class FaceRecognitionService:
    def __init__(self):
        self.tolerance = 0.7  # More lenient tolerance for better recognition accuracy
        
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
            
            # Find face locations and encodings with improved parameters
            face_locations = face_recognition.face_locations(image, model="hog", number_of_times_to_upsample=2)
            face_encodings = face_recognition.face_encodings(image, face_locations, num_jitters=5)
            
            faces = []
            for (top, right, bottom, left), encoding in zip(face_locations, face_encodings):
                # Convert to percentage coordinates
                height, width = image.shape[:2]
                bbox = [
                    (left / width) * 100,
                    (top / height) * 100,
                    (right / width) * 100,
                    (bottom / height) * 100
                ]
                
                faces.append({
                    "bbox": bbox,
                    "encoding": encoding.tolist(),
                    "confidence": 0.95  # Default confidence for detection
                })
            
            return {
                "faces": faces,
                "count": len(faces)
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
            
            # Find face locations and encodings in the image with improved parameters
            face_locations = face_recognition.face_locations(image, model="hog", number_of_times_to_upsample=2)
            face_encodings = face_recognition.face_encodings(image, face_locations, num_jitters=5)
            
            # Prepare known face encodings
            known_encodings = []
            known_names = []
            known_ids = []
            
            for known_face in known_faces:
                if 'encoding' in known_face and known_face['encoding']:
                    known_encodings.append(np.array(known_face['encoding']))
                    known_names.append(known_face['name'])
                    known_ids.append(known_face['id'])
            
            detections = []
            
            for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
                # Convert to percentage coordinates
                height, width = image.shape[:2]
                bbox = [
                    (left / width) * 100,
                    (top / height) * 100,
                    (right / width) * 100,
                    (bottom / height) * 100
                ]
                
                name = "Unknown"
                person_id = None
                confidence = 0.0
                is_recognized = False
                
                if known_encodings:
                    # Calculate face distances
                    face_distances = face_recognition.face_distance(known_encodings, face_encoding)
                    best_match_index = np.argmin(face_distances)
                    
                    if face_distances[best_match_index] < self.tolerance:
                        name = known_names[best_match_index]
                        person_id = known_ids[best_match_index]
                        confidence = 1.0 - face_distances[best_match_index]
                        is_recognized = True
                    else:
                        # Calculate confidence for unknown face
                        confidence = max(0.5, 1.0 - min(face_distances))
                
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
                "processing_time": "45ms"  # Mock processing time
            }
            
        except Exception as e:
            logger.error(f"Error in face recognition: {e}")
            return {"error": str(e)}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing operation parameter"}))
        sys.exit(1)
    
    operation = sys.argv[1]
    service = FaceRecognitionService()
    
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        if operation == "detect_and_encode":
            result = service.detect_and_encode_faces(input_data.get("imageData"))
        elif operation == "recognize_faces":
            result = service.recognize_faces(
                input_data.get("imageData"),
                input_data.get("knownFaces", [])
            )
        else:
            result = {"error": f"Unknown operation: {operation}"}
        
        print(json.dumps(result))
        
    except Exception as e:
        logger.error(f"Error in main: {e}")
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
