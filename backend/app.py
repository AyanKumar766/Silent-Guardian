import os
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Request Sharing for Next.js

# Global variable to load model once (lazy loading)
model = None

def get_model():
    global model
    if model is None:
        print("Loading Whisper model...")
        # 'base' is a good balance for CPU. Use 'tiny' for faster, 'small' for better accuracy.
        model = whisper.load_model("tiny")
        print("Whisper model loaded.")
    return model

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    # Save to a temporary file
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, file.filename or "temp_audio.wav")
    file.save(temp_path)

    try:
        # Load model and transcribe
        whisper_model = get_model()
        
        # Check if file size is too small (likely empty/silence)
        if os.path.getsize(temp_path) < 1000: # < 1KB
             return jsonify({"text": ""})

        result = whisper_model.transcribe(temp_path)
        
        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return jsonify({"text": result["text"].strip()})

    except Exception as e:
        print(f"Error during transcription: {str(e)}")
        # Return 200 with empty text so frontend doesn't think it's a catastrophic network error
        # or return a specific error code that frontend handles gracefully.
        # But failing to transcribe audio isn't a server crash.
        return jsonify({"text": "", "error": str(e)}), 200

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Whisper Backend is running"})

if __name__ == '__main__':
    # Run on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
