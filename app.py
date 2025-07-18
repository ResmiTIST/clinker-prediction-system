from flask import Flask, request, jsonify, render_template
from joblib import load
import numpy as np
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Load trained model
try:
    model = load('clinker_model.joblib')
    print("Model loaded successfully")
except FileNotFoundError:
    print("Error: model file not found")
    model = None

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        # Get data from request
        data = request.get_json()
        
        # Extract features
        lime = float(data.get('lime', 0))
        sand = float(data.get('sand', 0))
        clay = float(data.get('clay', 0))
        
        # Validate input ranges 
        if not (0 <= lime <= 100) or not (0 <= sand <= 100) or not (0 <= clay <= 100):
            return jsonify({'error': 'Feature values should be between 0 and 100'}), 400
        
        # Make prediction
        features = np.array([[lime, sand, clay]])
        prediction = model.predict(features)[0]
        
        # Return prediction
        return jsonify({
            'prediction': float(prediction),
            'features': {
                'lime': lime,
                'sand': sand,
                'clay': clay
            }
        })
        
    except ValueError as e:
        return jsonify({'error': 'Invalid input values. Please enter numeric values.'}), 400
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500
    

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
