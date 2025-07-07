
from dotenv import load_dotenv
import os

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
LLM_MODEL_NAME = "gemini-2.5-flash"
TTS_MODEL_NAME = "gemini-2.5-flash-preview-tts"
