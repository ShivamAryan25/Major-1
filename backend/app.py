from flask import Flask, request, jsonify
import numpy as np
import joblib
import tensorflow as tf
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load trained model and preprocessing utilities
model = tf.keras.models.load_model("depression_model.h5")
scaler = joblib.load("scaler.pkl")
label_encoders = joblib.load("label_encoders.pkl")

# Define feature order
FEATURES = [
    "Age", "Academic Pressure", "Study Satisfaction", "Work/Study Hours",
    "Financial Stress", "Sleep Duration", "Dietary Habits",
    "Have you ever had suicidal thoughts ?"
]

# Function to generate recommendations based on depression probability
def get_recommendations(depression_chance):
    if depression_chance <= 20:
        return {
            "message": "✅ Status: You seem to be in a good mental state!",
            "resources": [
                "Keep up your positive mindset.",
                "Maintain social connections and a balanced lifestyle.",
                "Exercise regularly and engage in hobbies.",
                "Continue practicing mindfulness and self-care."
            ]
        }
    elif depression_chance <= 40:
        return {
            "message": "⚠️ Status: Some early signs of stress or emotional exhaustion.",
            "resources": [
                "Identify stress triggers and find ways to manage them.",
                "Engage in healthy conversations with friends or mentors.",
                "Try meditation, yoga, or deep breathing exercises.",
                "Maintain a proper sleep schedule and avoid excessive screen time."
            ]
        }
    elif depression_chance <= 60:
        return {
            "message": "⚠️ Status: Signs of distress are increasing. Take proactive steps.",
            "resources": [
                "Reach out to a trusted friend, family member, or counselor.",
                "Reduce academic pressure with time management techniques.",
                "Engage in regular physical activities like walking or sports.",
                "Consider seeking professional help if feelings persist."
            ]
        }
    elif depression_chance <= 80:
        return {
            "message": "🚨 Status: You may be experiencing significant mental distress.",
            "resources": [
                "Seek guidance from a mental health professional.",
                "Avoid isolation—talk to someone you trust.",
                "Reduce workload and focus on self-care.",
                "Engage in activities that bring relaxation and peace.",
                "Avoid alcohol, smoking, or other unhealthy coping mechanisms."
            ]
        }
    else:
        return {
            "message": "🛑 Status: You are at a high risk of depression. Immediate action is needed!",
            "resources": [
                "Contact a psychologist or counselor immediately.",
                "Do not hesitate to seek help from a mental health helpline.",
                "Stay close to supportive friends or family members.",
                "Avoid self-harm or negative thoughts—help is available.",
                "Professional therapy and intervention are strongly recommended."
            ]
        }

@app.route('/')
def home():
    return "Welcome to the Depression Prediction API!", 200

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    try:
        # Convert JSON to DataFrame
        df = pd.DataFrame([data], columns=FEATURES)

        # Encode categorical features
        for col in ['Sleep Duration', 'Dietary Habits', 'Have you ever had suicidal thoughts ?']:
            df[col] = label_encoders[col].transform(df[col])

        # Normalize numerical features
        numerical_features = ['Age', 'Academic Pressure', 'Study Satisfaction', 'Work/Study Hours', 'Financial Stress']
        df[numerical_features] = scaler.transform(df[numerical_features])

        # Make prediction (Get probability score)
        probability = model.predict(df)[0][0]  # Extract probability

        # Convert probability to percentage
        depression_chance = round(probability * 100, 2)
        depression_chance_str = "{:.3f}%".format(depression_chance)

        # Generate response message
        response_message = f"You have {depression_chance_str} chances of falling into depression."

        # Get recommendations based on depression probability
        recommendations = get_recommendations(depression_chance)

        # Return prediction and recommendations
        return jsonify({
            "prediction": response_message,
            "recommendations": recommendations
        })

    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)