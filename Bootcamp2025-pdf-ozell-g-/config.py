
from dotenv import load_dotenv
import os

load_dotenv()

# LLM model config
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
LLM_MODEL_NAME = "gemini-2.5-flash"
TTS_MODEL_NAME = "gemini-2.5-flash-preview-tts"

# User auth config
SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# SQL DB config
SQLITECLOUD_HOST = os.getenv("SQLITECLOUD_HOST", "cwovl7xsnk.g4.sqlite.cloud")
SQLITECLOUD_PORT = os.getenv("SQLITECLOUD_PORT", "8860")
SQLITECLOUD_DATABASE = os.getenv("SQLITECLOUD_DATABASE", "kullanici-verileri")
SQLITECLOUD_API_KEY = os.getenv("SQLITECLOUD_API_KEY")
SQLITECLOUD_CONNECTION_STRING = f"sqlitecloud://{SQLITECLOUD_HOST}:{SQLITECLOUD_PORT}/{SQLITECLOUD_DATABASE}?apikey={SQLITECLOUD_API_KEY}"
