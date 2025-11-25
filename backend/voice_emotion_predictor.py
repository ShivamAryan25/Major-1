"""
Voice Emotion Detection Module
CNN-based emotion recognition from audio files
"""

import numpy as np
import librosa
import torch
import torch.nn as nn
import os
import logging
from typing import Dict, Tuple, Optional
from pydub import AudioSegment
import io

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Emotion mapping (0-based indexing)
IDX_TO_EMOTION = {
    0: "neutral",
    1: "calm",
    2: "happy",
    3: "sad",
    4: "angry",
    5: "fearful",
    6: "disgust",
    7: "surprised"
}

# Emotion to emoji mapping
EMOTION_EMOJI = {
    "neutral": "😐",
    "calm": "😌",
    "happy": "😊",
    "sad": "😢",
    "angry": "😠",
    "fearful": "😨",
    "disgust": "🤢",
    "surprised": "😲"
}

# Emotion descriptions
EMOTION_DESCRIPTION = {
    "neutral": "You sound balanced and composed",
    "calm": "Your voice reflects tranquility and peace",
    "happy": "Your voice radiates joy and positivity",
    "sad": "Your voice carries a sense of sadness",
    "angry": "Your voice shows signs of frustration",
    "fearful": "Your voice indicates worry or anxiety",
    "disgust": "Your voice expresses displeasure",
    "surprised": "Your voice shows amazement or shock"
}


def convert_to_wav(input_path: str, output_path: str) -> bool:
    """Convert audio file to WAV format using pydub"""
    try:
        # Detect format from file extension
        file_ext = os.path.splitext(input_path)[1].lower()
        format_map = {
            '.webm': 'webm',
            '.ogg': 'ogg',
            '.mp3': 'mp3',
            '.mp4': 'mp4',
            '.m4a': 'm4a',
            '.wav': 'wav'
        }
        
        audio_format = format_map.get(file_ext, 'webm')
        
        # Load audio in any format
        audio = AudioSegment.from_file(input_path, format=audio_format)
        
        # Convert to mono if stereo
        if audio.channels > 1:
            audio = audio.set_channels(1)
        
        # Set sample rate to 22050 Hz
        audio = audio.set_frame_rate(22050)
        
        # Export as WAV
        audio.export(output_path, format='wav')
        logger.info(f"Successfully converted {input_path} to WAV format")
        return True
        
    except Exception as e:
        logger.error(f"Error converting audio file: {e}", exc_info=True)
        return False


def extract_features(file_path: str, max_pad_len: int = 174) -> Optional[np.ndarray]:
    """Extract MFCC features from audio file"""
    temp_wav_path = None
    try:
        # Check if file needs conversion
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext != '.wav':
            # Convert to WAV first
            temp_wav_path = file_path.replace(file_ext, '_converted.wav')
            if not convert_to_wav(file_path, temp_wav_path):
                raise ValueError("Failed to convert audio to WAV format")
            file_to_load = temp_wav_path
        else:
            file_to_load = file_path
        
        # Load audio with librosa
        audio, sr = librosa.load(file_to_load, sr=22050, mono=True)
        
        # Check if audio is too short
        if len(audio) < 0.5 * sr:  # Less than 0.5 seconds
            logger.warning(f"Audio file is too short: {len(audio)/sr:.2f} seconds")
        
        # Extract MFCCs
        mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=40)
        
        # Pad or truncate to max_pad_len
        pad_width = max_pad_len - mfccs.shape[1]
        if pad_width > 0:
            mfccs = np.pad(mfccs, pad_width=((0, 0), (0, pad_width)), mode="constant")
        else:
            mfccs = mfccs[:, :max_pad_len]
        
        logger.info(f"Successfully extracted features with shape: {mfccs.shape}")
        return mfccs
        
    except Exception as e:
        logger.error(f"Error processing {file_path}: {e}", exc_info=True)
        return None
    
    finally:
        # Clean up temporary WAV file
        if temp_wav_path and os.path.exists(temp_wav_path):
            try:
                os.unlink(temp_wav_path)
            except:
                pass


class CNNEmotion(nn.Module):
    """CNN Model for emotion recognition"""
    def __init__(self, num_classes: int = 8):
        super(CNNEmotion, self).__init__()
        self.conv1 = nn.Conv2d(1, 16, kernel_size=3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv2 = nn.Conv2d(16, 32, kernel_size=3, padding=1)
        self.fc1 = nn.Linear(32*10*43, 128)
        self.fc2 = nn.Linear(128, num_classes)

    def forward(self, x):
        x = self.pool(torch.relu(self.conv1(x)))
        x = self.pool(torch.relu(self.conv2(x)))
        x = x.view(x.size(0), -1)
        x = torch.relu(self.fc1(x))
        return self.fc2(x)


class VoiceEmotionPredictor:
    """Voice emotion prediction using trained CNN model"""
    
    def __init__(self, model_path: str = "voice_cnn.pth"):
        self.model = None
        self.model_path = model_path
        
    def load_model(self) -> bool:
        """Load the trained model"""
        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            self.model = CNNEmotion(num_classes=8)
            self.model.load_state_dict(torch.load(self.model_path, map_location=torch.device('cpu')))
            self.model.eval()
            
            logger.info("Voice emotion model loaded successfully")
            return True
        
        except Exception as e:
            logger.error(f"Error loading voice emotion model: {e}")
            return False
    
    def predict_emotion(self, audio_file_path: str) -> Dict:
        """Predict emotion from audio file"""
        if self.model is None:
            self.load_model()
        
        try:
            # Extract features from the audio file
            mfcc = extract_features(audio_file_path)
            if mfcc is None:
                raise ValueError("Failed to extract features from audio file")
            
            # Prepare input for the model
            mfcc = np.array(mfcc)[np.newaxis, np.newaxis, :, :]  # Shape: (1, 1, 40, 174)
            mfcc = torch.tensor(mfcc, dtype=torch.float32)
            
            # Make prediction
            with torch.no_grad():
                output = self.model(mfcc)
                probabilities = torch.softmax(output, dim=1).numpy()[0]
                predicted_idx = torch.argmax(output, dim=1).item()
            
            # Get predicted emotion and confidence
            predicted_emotion = IDX_TO_EMOTION[predicted_idx]
            confidence = float(probabilities[predicted_idx] * 100)
            
            # Get all emotion probabilities
            all_probabilities = {}
            for idx, emotion in IDX_TO_EMOTION.items():
                all_probabilities[emotion] = float(probabilities[idx] * 100)
            
            # Sort probabilities by value
            sorted_emotions = sorted(all_probabilities.items(), key=lambda x: x[1], reverse=True)
            
            logger.info(f"Predicted emotion: {predicted_emotion} with {confidence:.2f}% confidence")
            
            return {
                "emotion": predicted_emotion,
                "emoji": EMOTION_EMOJI[predicted_emotion],
                "description": EMOTION_DESCRIPTION[predicted_emotion],
                "confidence": round(confidence, 2),
                "all_probabilities": all_probabilities,
                "top_emotions": [
                    {
                        "emotion": emotion,
                        "emoji": EMOTION_EMOJI[emotion],
                        "probability": round(prob, 2)
                    }
                    for emotion, prob in sorted_emotions[:3]
                ]
            }
        
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            raise Exception(f"Failed to predict emotion: {str(e)}")


# Global instance
voice_emotion_predictor = VoiceEmotionPredictor()

