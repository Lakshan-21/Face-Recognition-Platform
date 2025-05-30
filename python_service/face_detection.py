#!/usr/bin/env python3
"""
Real Face Detection Service
Provides accurate face detection with actual bounding box coordinates
"""

import sys
import json
import base64
import numpy as np
import cv2
import face_recognition
from io import BytesIO
from PIL import Image

def decode_image(image_data):
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
        return None

def detect_faces(image_data):
    """Detect faces in image and return face locations and encodings"""
    try:
        # Decode the image
        image = decode_image(image_data)
        if image is None:
            return {"faces": [], "count": 0}
        
        # Find face locations
        face_locations = face_recognition.face_locations(image)
        
        if not face_locations:
            return {"faces": [], "count": 0}
        
        # Generate face encodings
        face_encodings = face_recognition.face_encodings(image, face_locations)
        
        faces = []
        for i, (top, right, bottom, left) in enumerate(face_locations):
            # Convert face_recognition format (top, right, bottom, left) to bbox format (left, top, right, bottom)
            bbox = [left, top, right, bottom]
            
            # Get face encoding if available
            encoding = face_encodings[i].tolist() if i < len(face_encodings) else []
            
            # Calculate confidence based on face size (larger faces = higher confidence)
            face_width = right - left
            face_height = bottom - top
            face_area = face_width * face_height
            confidence = min(0.95, 0.7 + (face_area / 10000))  # Scale based on face size
            
            faces.append({
                "bbox": bbox,
                "encoding": encoding,
                "confidence": round(confidence, 2)
            })
        
        return {"faces": faces, "count": len(faces)}
        
    except Exception as e:
        return {"faces": [], "count": 0, "error": str(e)}

def recognize_faces(image_data, known_faces):
    """Recognize faces against known face database"""
    try:
        # Decode the image
        image = decode_image(image_data)
        if image is None:
            return {"detections": [], "count": 0}
        
        # Find face locations and encodings
        face_locations = face_recognition.face_locations(image)
        face_encodings = face_recognition.face_encodings(image, face_locations)
        
        if not face_locations:
            return {"detections": [], "count": 0}
        
        detections = []
        
        for i, (top, right, bottom, left) in enumerate(face_locations):
            # Convert to bbox format
            bbox = [left, top, right, bottom]
            
            name = "Unknown"
            confidence = 50
            is_recognized = False
            person_id = None
            
            if i < len(face_encodings) and known_faces:
                face_encoding = face_encodings[i]
                
                # Compare against known faces
                for known_face in known_faces:
                    if 'encoding' in known_face and known_face['encoding']:
                        try:
                            known_encoding = np.array(known_face['encoding'])
                            matches = face_recognition.compare_faces([known_encoding], face_encoding, tolerance=0.6)
                            
                            if matches[0]:
                                # Calculate distance for confidence
                                distance = face_recognition.face_distance([known_encoding], face_encoding)[0]
                                confidence = max(50, int((1 - distance) * 100))
                                name = known_face['name']
                                person_id = known_face['id']
                                is_recognized = True
                                break
                        except:
                            continue
            
            detections.append({
                "bbox": bbox,
                "name": name,
                "personId": person_id,
                "confidence": confidence,
                "isRecognized": is_recognized
            })
        
        return {"detections": detections, "count": len(detections)}
        
    except Exception as e:
        return {"detections": [], "count": 0, "error": str(e)}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing operation argument"}))
        return
    
    operation = sys.argv[1]
    
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        if operation == "detect":
            result = detect_faces(input_data.get("imageData"))
        elif operation == "recognize":
            result = recognize_faces(input_data.get("imageData"), input_data.get("knownFaces", []))
        else:
            result = {"error": "Unknown operation"}
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()