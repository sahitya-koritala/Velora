from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import numpy as np

app = Flask(__name__)
CORS(app)

# Load the pre-trained Sentence Transformer model
# 'all-MiniLM-L6-v2' is fast, lightweight, and perfect for hackathons
print("Loading model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded successfully.")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "Velora AI Service"})

@app.route('/embed', methods=['POST'])
def embed_text():
    """
    Generate an embedding for the given text using SentenceTransformers.
    """
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({"error": "Missing 'text' in request body"}), 400
        
    text = data['text']
    
    # Generate embedding
    embedding = model.encode(text)
    
    # Convert numpy float32 to python float for JSON serialization
    embedding_list = embedding.tolist()
    
    return jsonify({
        "embedding": embedding_list,
        "dimensions": len(embedding_list)
    })

if __name__ == '__main__':
    from waitress import serve
    print("Starting Velora AI Service on port 8000...")
    serve(app, host="0.0.0.0", port=8000)
