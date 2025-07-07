from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn
import os
import shutil
from google import genai
from chatbot import get_response, synthesize_speech, set_initial_context, find_mistakes
import config

app = FastAPI()

client = genai.Client(api_key=config.GEMINI_API_KEY) # https://ai.google.dev/gemini-api/docs/quickstart?hl=tr 

templates = Jinja2Templates(directory="templates") # html dosyalarını yüklemek için

app.mount("/static", StaticFiles(directory="static"), name="static") # js ve css dosyalarını yüklemek için

async def transcribe_audio(file: UploadFile): # verdiğin ses dosyasını metne çeviren fonksiyon
    temp_dir = None
    try:
        temp_dir = "temp_audio"
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, "recording.wav")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        audio_file = client.files.upload(file=file_path)
        
        # https://ai.google.dev/gemini-api/docs/audio?hl=tr dan bakabilirsiniz direkt oradan aldım 
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=['Bu ses dosyasını metne çevir. Sadece çevrilen metni döndür, başka bir şey ekleme.', audio_file]
        )
        
        if response and response.text:
            return response.text.strip()
        else:
            raise Exception("Ses tanıma başarısız oldu.")
            
    except Exception as e:
        print(f"Error in transcribe_audio: {e}")
        raise e
    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/submit-preferences")
async def submit_preferences(preferences: dict):
    set_initial_context(preferences)
    return JSONResponse(content={"message": "Preferences received successfully"})

@app.post("/chat-text")
async def chat_text(request: Request):
    data = await request.json()
    text = data.get("text")
    response = get_response(text)
    return JSONResponse(content={"response": response})

@app.post("/chat-audio")
async def chat_audio(file: UploadFile = File(...)):
    try:
        recognized_text = await transcribe_audio(file)

        chat_response = get_response(recognized_text)
        return JSONResponse(content={"response": chat_response})
        
    except Exception as e:
        print(f"Error in chat_audio: {e}")
        return JSONResponse(content={"error": "Ses işlenirken bir hata oluştu."}, status_code=500)

@app.post("/mistakes-by-audio")
async def correct_mistakes_by_audio(file: UploadFile = File(...)):
    try:
        recognized_text = await transcribe_audio(file)
        
        corrected_response = find_mistakes(recognized_text)
        return JSONResponse(content={"response": corrected_response})
        
    except Exception as e:
        print(f"Error in correct_mistakes_by_audio: {e}")
        return JSONResponse(content={"error": "Ses işlenirken bir hata oluştu."}, status_code=500)

@app.post("/synthesize-speech")
async def synthesize_speech_endpoint(request: Request):
    data = await request.json()
    text = data.get("text")
    file_name = synthesize_speech(text)
    
    if file_name and isinstance(file_name, str) and os.path.exists(file_name):
        # Dosyayı oku ve streaming response olarak döndür
        def iterfile():
            with open(file_name, "rb") as file:
                yield from file
        
        return StreamingResponse(iterfile(), media_type="audio/wav")
    else:
        return JSONResponse(content={"error": "Ses dosyası oluşturulamadı"}, status_code=500)

@app.post("/synthesize-evaluation-speech")
async def synthesize_evaluation_speech_endpoint(request: Request):
    data = await request.json()
    text = data.get("text")
    file_name = synthesize_speech(text)
    
    if file_name and isinstance(file_name, str) and os.path.exists(file_name):
        # Dosyayı oku ve streaming response olarak döndür
        def iterfile():
            with open(file_name, "rb") as file:
                yield from file
        
        return StreamingResponse(iterfile(), media_type="audio/wav")
    else:
        return JSONResponse(content={"error": "Ses dosyası oluşturulamadı"}, status_code=500)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
