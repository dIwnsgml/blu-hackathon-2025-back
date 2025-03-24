from flask import Flask, jsonify, request
import cv2
import numpy as np
import base64
import requests
import json
import easyocr
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=".env.development")

app = Flask(__name__)
CORS(app, support_credentials=True)


@app.route('/extract_cost', methods=['POST'])  # Changed to POST
@cross_origin(supports_credentials=True)
def extract_cost():
    data = request.get_json()
    prompt_text = data['text']
    
    # Your API token
    api_token = "ef3fc1c0236ec575c3c6757b2fa940e982439c52cfb0236c95a024c26f0557ab"
    print(os.environ.get("AI_API_KEY"))

    # API endpoint URL

    url = "https://api.together.xyz/v1/chat/completions"

    # The payload (data) you want to send
    data = {
        "model": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        "messages": [
            {
                "role": "user",
                "content": "The following text is extracted from a receipt, please extract the total cost and only return the number:\n"
                + prompt_text
            },
        ],
        "max_tokens": None,
        "temperature": 0.7,
        "top_p": 0.7,
        "top_k": 50,
        "repetition_penalty": 1,
        "stop": ["<|eot_id|>", "<|eom_id|>"],
        "stream": False
    }

    # Headers with the API token
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json"
    }

    # Make the request
    response = requests.post(url, data=json.dumps(data), headers=headers)

    # Check the response
    if response.status_code == 200:
        value = response.json()["choices"][0]["message"]['content']
        return jsonify({'value': value,'success': True}), 200
    else:
        print("Error:", response.status_code, response.text)
    

@app.route('/read', methods=['POST'])  # Changed to POST
@cross_origin(supports_credentials=True)
def detect_pose():
    # Get image data from client
    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({'error': 'No image data provided', 'success': False}), 400

    try:
        # Decode base64 image
        print("decode before")
        img_data = base64.b64decode(data['image'])
        np_arr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            return jsonify({'error': 'Invalid image data', 'success': False}), 400

        enhanced_image = cv2.medianBlur(img, 3)

        reader = easyocr.Reader(['en'])  # Load English model
        text = reader.readtext(enhanced_image, detail=0)

        guess = " ".join(text)

        # Your API token
        api_token = "ef3fc1c0236ec575c3c6757b2fa940e982439c52cfb0236c95a024c26f0557ab"

        # API endpoint URL

        url = "https://api.together.xyz/v1/chat/completions"

        # The payload (data) you want to send
        data = {
            "model": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
            "messages": [
                {
                    "role": "user",
                    "content": "Fix spelling errors in this text while keeping the original meaning:\n\n"
                    + guess
                },
            ],
            "max_tokens": None,
            "temperature": 0.7,
            "top_p": 0.7,
            "top_k": 50,
            "repetition_penalty": 1,
            "stop": ["<|eot_id|>", "<|eom_id|>"],
            "stream": False
        }

        # Headers with the API token
        headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }

        # Make the request
        response = requests.post(url, data=json.dumps(data), headers=headers)

        # Check the response
        if response.status_code == 200:
            print("Success:", response.json())
            corrected_text = response.json()["choices"][0]["message"]['content']
            print("Original:", guess)
            print("Corrected text:", corrected_text)
            return jsonify({'text': corrected_text,'success': True}), 200
        else:
            print("Error:", response.status_code, response.text)
            
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=4008)  # Bind to 0.0.0.0 for external access