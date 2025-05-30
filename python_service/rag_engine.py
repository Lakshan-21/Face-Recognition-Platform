#!/usr/bin/env python3
"""
RAG Engine for Face Recognition Platform Chat Interface
Uses LangChain + FAISS + OpenAI for intelligent querying
"""

import sys
import json
import os
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
import openai
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import CharacterTextSplitter
from langchain.llms import OpenAI
from langchain.chains import RetrievalQA
from langchain.docstore.document import Document

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGEngine:
    def __init__(self):
        # Initialize OpenAI API key
        self.openai_api_key = os.getenv('OPENAI_API_KEY') or os.getenv('OPENAI_API_KEY_ENV_VAR') or "default_key"
        openai.api_key = self.openai_api_key
        
        # Initialize LangChain components
        self.embeddings = OpenAIEmbeddings(openai_api_key=self.openai_api_key)
        self.llm = OpenAI(temperature=0.7, openai_api_key=self.openai_api_key)
        self.vector_store = None
        self.qa_chain = None
        
    def create_knowledge_base(self, context_data: Dict[str, Any]) -> None:
        """Create vector knowledge base from context data"""
        try:
            documents = []
            
            # Process face registrations
            if 'registrations' in context_data:
                for reg in context_data['registrations']:
                    doc_text = f"""
                    Person: {reg['name']}
                    ID: {reg['id']}
                    Role: {reg.get('role', 'Not specified')}
                    Department: {reg.get('department', 'Not specified')}
                    Registered: {reg['registeredAt']}
                    Status: {'Active' if reg['isActive'] else 'Inactive'}
                    """
                    
                    documents.append(Document(
                        page_content=doc_text,
                        metadata={
                            "type": "registration",
                            "person_id": reg['id'],
                            "person_name": reg['name'],
                            "timestamp": reg['registeredAt']
                        }
                    ))
            
            # Process recognition events
            if 'recentEvents' in context_data:
                for event in context_data['recentEvents']:
                    doc_text = f"""
                    Recognition Event:
                    Person: {event['personName']}
                    Confidence: {event['confidence']}%
                    Detected at: {event['detectedAt']}
                    Status: {'Recognized' if event['isRecognized'] else 'Unknown'}
                    """
                    
                    documents.append(Document(
                        page_content=doc_text,
                        metadata={
                            "type": "recognition_event",
                            "person_name": event['personName'],
                            "confidence": event['confidence'],
                            "timestamp": event['detectedAt'],
                            "is_recognized": event['isRecognized']
                        }
                    ))
            
            # Process system statistics
            if 'stats' in context_data:
                stats = context_data['stats']
                doc_text = f"""
                System Statistics:
                Total Detections: {stats.get('totalDetections', 0)}
                Recognized Faces: {stats.get('recognizedFaces', 0)}
                Unknown Faces: {stats.get('unknownFaces', 0)}
                Average Confidence: {stats.get('averageConfidence', 0)}%
                Last Updated: {datetime.now().isoformat()}
                """
                
                documents.append(Document(
                    page_content=doc_text,
                    metadata={
                        "type": "system_stats",
                        "timestamp": datetime.now().isoformat()
                    }
                ))
            
            # Split documents if needed
            text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            split_docs = text_splitter.split_documents(documents)
            
            # Create vector store
            if split_docs:
                self.vector_store = FAISS.from_documents(split_docs, self.embeddings)
                
                # Create QA chain
                self.qa_chain = RetrievalQA.from_chain_type(
                    llm=self.llm,
                    chain_type="stuff",
                    retriever=self.vector_store.as_retriever(search_kwargs={"k": 5}),
                    return_source_documents=True
                )
                
                logger.info(f"Knowledge base created with {len(split_docs)} documents")
            else:
                logger.warning("No documents created for knowledge base")
                
        except Exception as e:
            logger.error(f"Error creating knowledge base: {e}")
    
    def query(self, question: str) -> str:
        """Query the RAG system with a question"""
        try:
            if not self.qa_chain:
                return "I'm sorry, but the knowledge base is not available right now. Please try again later."
            
            # Process the query
            result = self.qa_chain({"query": question})
            
            # Extract answer
            answer = result.get('result', 'I could not find a relevant answer to your question.')
            
            # Enhance answer with context
            enhanced_answer = self._enhance_answer(question, answer, result.get('source_documents', []))
            
            return enhanced_answer
            
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return f"I encountered an error while processing your question: {str(e)}"
    
    def _enhance_answer(self, question: str, answer: str, source_docs: List[Document]) -> str:
        """Enhance the answer with additional context and formatting"""
        
        # Common question patterns
        if "last person registered" in question.lower():
            # Find most recent registration
            registration_docs = [doc for doc in source_docs if doc.metadata.get('type') == 'registration']
            if registration_docs:
                latest_doc = max(registration_docs, key=lambda x: x.metadata.get('timestamp', ''))
                person_name = latest_doc.metadata.get('person_name', 'Unknown')
                timestamp = latest_doc.metadata.get('timestamp', '')
                return f"The last person registered was {person_name} at {self._format_timestamp(timestamp)}."
        
        elif "how many" in question.lower() and "registered" in question.lower():
            # Count registrations
            registration_docs = [doc for doc in source_docs if doc.metadata.get('type') == 'registration']
            count = len(set(doc.metadata.get('person_id') for doc in registration_docs if doc.metadata.get('person_id')))
            return f"Currently, there are {count} people registered in the system."
        
        elif "when was" in question.lower() and "registered" in question.lower():
            # Find specific person registration
            person_name = self._extract_person_name(question)
            if person_name:
                for doc in source_docs:
                    if (doc.metadata.get('type') == 'registration' and 
                        person_name.lower() in doc.metadata.get('person_name', '').lower()):
                        timestamp = doc.metadata.get('timestamp', '')
                        return f"{doc.metadata.get('person_name')} was registered at {self._format_timestamp(timestamp)}."
        
        return answer
    
    def _extract_person_name(self, question: str) -> str:
        """Extract person name from question"""
        # Simple extraction - could be enhanced with NLP
        words = question.split()
        for i, word in enumerate(words):
            if word.lower() in ['was', 'is'] and i + 1 < len(words):
                return words[i + 1].strip('?.,')
        return ""
    
    def _format_timestamp(self, timestamp: str) -> str:
        """Format timestamp for human readability"""
        try:
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            now = datetime.now()
            
            if dt.date() == now.date():
                return f"today at {dt.strftime('%I:%M %p')}"
            elif dt.date() == (now - timedelta(days=1)).date():
                return f"yesterday at {dt.strftime('%I:%M %p')}"
            else:
                return dt.strftime('%B %d, %Y at %I:%M %p')
        except:
            return timestamp

def main():
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        message = input_data.get('message', '')
        context = input_data.get('context', {})
        
        if not message:
            print(json.dumps({"error": "No message provided"}))
            sys.exit(1)
        
        # Initialize RAG engine
        rag_engine = RAGEngine()
        
        # Create knowledge base from context
        rag_engine.create_knowledge_base(context)
        
        # Process query
        answer = rag_engine.query(message)
        
        # Return response
        result = {
            "answer": answer,
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        logger.error(f"Error in RAG main: {e}")
        print(json.dumps({
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
            "status": "error"
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
