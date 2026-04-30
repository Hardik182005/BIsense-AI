"""
BISense AI — Voice Router (TTS/STT)
Powered by Google Cloud Text-to-Speech & Speech-to-Text.
"""
import os
import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google.cloud import texttospeech

router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    language_code: str = "en-IN"

class TTSResponse(BaseModel):
    audio_content: str  # Base64 encoded MP3

@router.post("/tts", response_model=TTSResponse)
async def text_to_speech(req: TTSRequest):
    """Convert text to speech using Google Cloud TTS."""
    try:
        # Check for credentials implicitly via env var or standard auth
        client = texttospeech.TextToSpeechClient()
        
        synthesis_input = texttospeech.SynthesisInput(text=req.text)

        # Select the voice (Neural2 is high quality)
        # For en-IN, Neural2-A or B are good
        voice = texttospeech.VoiceSelectionParams(
            language_code=req.language_code,
            name=f"{req.language_code}-Neural2-B" 
        )

        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            pitch=0.0,
            speaking_rate=1.0
        )

        response = client.synthesize_speech(
            input=synthesis_input, 
            voice=voice, 
            audio_config=audio_config
        )

        return TTSResponse(
            audio_content=base64.b64encode(response.audio_content).decode("utf-8")
        )
    except Exception as e:
        print(f"[BISense Voice] TTS error: {e}")
        # Fallback to a clear message if TTS fails
        raise HTTPException(status_code=500, detail=str(e))
