"""
Depression Prediction Module
ML-based depression risk assessment using trained Keras model
"""

import numpy as np
import joblib
import tensorflow as tf
import pandas as pd
import os
import logging
from typing import Dict, List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Feature definitions
FEATURES = [
    "Age", "Academic Pressure", "Study Satisfaction", "Work/Study Hours",
    "Financial Stress", "Sleep Duration", "Dietary Habits",
    "Have you ever had suicidal thoughts ?"
]

CATEGORICAL_FEATURES = ['Sleep Duration', 'Dietary Habits', 'Have you ever had suicidal thoughts ?']
NUMERICAL_FEATURES = ['Age', 'Academic Pressure', 'Study Satisfaction', 'Work/Study Hours', 'Financial Stress']

class DepressionPredictor:
    """Depression prediction using trained ML model"""
    
    def __init__(self, model_path: str = "depression_model.h5", 
                 scaler_path: str = "scaler.pkl",
                 encoders_path: str = "label_encoders.pkl"):
        self.model = None
        self.scaler = None
        self.label_encoders = None
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.encoders_path = encoders_path
        
    def load_model(self):
        """Load the trained model and preprocessing utilities"""
        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            if not os.path.exists(self.scaler_path):
                raise FileNotFoundError(f"Scaler file not found: {self.scaler_path}")
            if not os.path.exists(self.encoders_path):
                raise FileNotFoundError(f"Label encoders file not found: {self.encoders_path}")
            
            self.model = tf.keras.models.load_model(self.model_path)
            self.scaler = joblib.load(self.scaler_path)
            self.label_encoders = joblib.load(self.encoders_path)
            
            logger.info("Depression prediction model loaded successfully")
            return True
        
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return False
    
    def get_recommendations(self, depression_chance: float) -> Dict[str, any]:
        """Generate recommendations based on depression probability"""
        if depression_chance <= 20:
            return {
                "message": "✅ Status: You seem to be in a good mental state!",
                "level": "low",
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
                "level": "mild",
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
                "level": "moderate",
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
                "level": "high",
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
                "level": "critical",
                "resources": [
                    "Contact a psychologist or counselor immediately.",
                    "Do not hesitate to seek help from a mental health helpline.",
                    "Stay close to supportive friends or family members.",
                    "Avoid self-harm or negative thoughts—help is available.",
                    "Professional therapy and intervention are strongly recommended."
                ]
            }
    
    def predict(self, user_data: Dict) -> Dict:
        """Make depression prediction"""
        if self.model is None:
            self.load_model()
        
        try:
            # Convert to DataFrame
            df = pd.DataFrame([user_data], columns=FEATURES)
            
            # Encode categorical features
            for col in CATEGORICAL_FEATURES:
                if col not in self.label_encoders:
                    raise ValueError(f"Label encoder not found for column: {col}")
                df[col] = self.label_encoders[col].transform(df[col])
            
            # Normalize numerical features
            df[NUMERICAL_FEATURES] = self.scaler.transform(df[NUMERICAL_FEATURES])
            
            # Make prediction
            probability = self.model.predict(df, verbose=0)[0][0]
            
            # Convert to percentage
            depression_chance = round(float(probability * 100), 2)
            
            # Generate recommendations
            recommendations = self.get_recommendations(depression_chance)
            
            return {
                "depression_probability": depression_chance,
                "prediction_message": f"You have {depression_chance:.2f}% chance of experiencing depression.",
                "recommendations": recommendations
            }
        
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            raise Exception(f"Failed to make prediction: {str(e)}")


# Global instance
depression_predictor = DepressionPredictor()

