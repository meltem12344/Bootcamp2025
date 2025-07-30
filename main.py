from fastapi import FastAPI, File, UploadFile, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn
import os
import shutil
import json
from google import genai
import auth
from chatbot import *
import config
from db_op import *

app = FastAPI()
app.include_router(auth.router)
client = genai.Client(api_key=config.GEMINI_API_KEY)

templates = Jinja2Templates(directory="templates")

app.mount("/static", StaticFiles(directory="static"), name="static")



async def transcribe_audio(file: UploadFile): # verdiğin ses dosyasını metne çeviren fonksiyon
    temp_dir = None
    try:
        temp_dir = "temp_audio"
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, "recording.wav")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        audio_file = client.files.upload(file=file_path)
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=['Bu ses dosyasını metne çevir. Sadece çevrilen metni döndür, başka bir şey ekleme.', audio_file]
        )
        
        if response and response.text:
            return response.text.strip()
        else:
            raise Exception("Ses tanıma başarısız oldu.")
            
    except Exception as e:
        print(e)
        raise e
    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
            



@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    # Ana sayfa artık client-side login kontrolü yapıyor
    # Burada sadece template'i döndürüyoruz
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/login",response_class=HTMLResponse)
async def login(request:Request):
    return templates.TemplateResponse('login.html',{'request':request})




@app.get("/get-user-preferences/{user_id}")
async def get_user_preferences_endpoint(user_id: str):
    try:
        preferences = get_user_preferences(user_id)
        if preferences:
            return JSONResponse(content=preferences)
        else:
            return JSONResponse(content={}, status_code=404)
    except Exception as e:
        print(e)
        return JSONResponse(content={"error": "Preferences alınırken hata oluştu"}, status_code=500)

@app.post("/submit-preferences")
async def submit_preferences(request: Request):
    data = await request.json()
    user_id = data.get("user_id")
    preferences = data.get("preferences")
    
    if not user_id or not preferences:
        return JSONResponse(content={"error": "user_id ve preferences gerekli"}, status_code=400)
    
    
    save_user_preferences(user_id, preferences)
    return JSONResponse(content={"message": "Preferences received successfully"})

@app.post("/chat-text")
async def chat_text(request: Request):
    data = await request.json()
    user_id = data.get("user_id")
    text = data.get("text")
    preferences = get_user_preferences(user_id)
    if preferences:
        set_initial_context(preferences)
        
    if not user_id or not text:
        return JSONResponse(content={"error": "user_id ve text gerekli"}, status_code=400)
    
    response = get_response(text)
    
    save_user_question(user_id, text, response, question_type='text')
    
    update_user_chat_count(user_id)
    
    return JSONResponse(content={"response": response})

@app.post("/chat-audio")
async def chat_audio(user_id: str = Form(...), file: UploadFile = File(...)):
    try:
        if not user_id or not file:
            return JSONResponse(content={"error": "user_id ve file gerekli"}, status_code=400)
        
        recognized_text = await transcribe_audio(file)
        chat_response = get_response(recognized_text)
        preferences = get_user_preferences(user_id)
        if preferences:
            set_initial_context(preferences)
            
        save_user_question(user_id, recognized_text, chat_response, question_type='audio')
        
        update_user_chat_count(user_id)
        
        return JSONResponse(content={"response": chat_response})
        
    except Exception as e:
        print(e)
        return JSONResponse(content={"error": "Ses işlenirken bir hata oluştu."}, status_code=500)

@app.post("/mistakes-by-audio")
async def correct_mistakes_by_audio(file: UploadFile = File(...)):
    try:
        recognized_text = await transcribe_audio(file)
        
        corrected_response = find_mistakes(recognized_text)
        return JSONResponse(content={"response": corrected_response})
        
    except Exception as e:
        print(e)
        return JSONResponse(content={"error": "Ses işlenirken bir hata oluştu."}, status_code=500)

@app.post("/synthesize-speech")
async def synthesize_speech_endpoint(request: Request):
    data = await request.json()
    text = data.get("text")
    file_name = synthesize_speech(text)
    
    if file_name and isinstance(file_name, str) and os.path.exists(file_name):
        def iterfile():
            with open(file_name, "rb") as file:
                yield from file
        
        return StreamingResponse(iterfile(), media_type="audio/wav")
    else:
        return JSONResponse(content={"error": "Ses dosyası oluşturulamadı"}, status_code=500)

@app.post("/generate-quiz-questions")
async def generate_quiz_questions_endpoint(request: Request):
    try:
        data = await request.json()
        topic = data.get("topic")
        difficulty = data.get("difficulty")
        user_id = data.get("user_id")
        question_count = data.get("question_count", 5)
        
        if not topic or not difficulty:
            return JSONResponse(content={"error": "Konu ve zorluk seviyesi gerekli"}, status_code=400)
        
        # Tek seferde tüm soruları oluştur
        questions_response = generate_multiple_quiz_questions(topic, difficulty, question_count)
        update_user_quiz_count(user_id)
        if not questions_response:
            return JSONResponse(content={"error": "Sorular oluşturulamadı"}, status_code=500)
        
        try:
            if isinstance(questions_response, str):
                questions_data = json.loads(questions_response)
                if isinstance(questions_data, list) and len(questions_data) > 0:
                    return JSONResponse(content={"questions": questions_data})
                else:
                    return JSONResponse(content={"error": "Geçersiz soru formatı"}, status_code=500)
            else:
                return JSONResponse(content={"error": "Soru formatı geçersiz"}, status_code=500)
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            return JSONResponse(content={"error": "Soru formatı geçersiz"}, status_code=500)
        
    except Exception as e:
        print(f"Quiz questions generation error: {e}")
        return JSONResponse(content={"error": "Quiz soruları oluşturulurken hata oluştu"}, status_code=500)

@app.post("/submit-quiz-answer")
async def submit_quiz_answer_endpoint(request: Request):
    try:
        data = await request.json()
        user_id = data.get("user_id")
        question_data = data.get("question_data")
        user_answer = data.get("user_answer")
        time_taken = data.get("time_taken", 0)
        
        if not user_id or not question_data or not user_answer:
            return JSONResponse(content={"error": "Eksik veri"}, status_code=400)
        
        # Cevabı doğrula
        validation_result = validate_quiz_answer(question_data, user_answer)
        
        if not validation_result:
            return JSONResponse(content={"error": "Cevap doğrulanamadı"}, status_code=500)
        
        # Veritabanına kaydet
        save_success = save_quiz_result(
            user_id=user_id,
            question_text=question_data.get("question", ""),
            user_answer=user_answer,
            correct_answer=validation_result["correct_answer"],
            is_correct=validation_result["is_correct"],
            topic=question_data.get("topic", ""),
            difficulty=question_data.get("difficulty", ""),
            time_taken=time_taken
        )
        
        if not save_success:
            print("Veritabanına kayıt başarısız")
        
        return JSONResponse(content=validation_result)
        
    except Exception as e:
        print(e)
        return JSONResponse(content={"error": "Cevap gönderilirken hata oluştu"}, status_code=500)

@app.get("/user-performance/{user_id}")
async def get_user_performance_endpoint(user_id: str):
    # 
    try:
        performance = get_user_performance(user_id)
        
        if performance is None:
            return JSONResponse(content={"error": "Performans verisi alınamadı"}, status_code=500)
        
        return JSONResponse(content=performance)
        
    except Exception as e:
        print(e)
        return JSONResponse(content={"error": "Performans verisi alınırken hata oluştu"}, status_code=500)

@app.get("/user-session-stats/{user_id}")
async def get_user_session_stats_endpoint(user_id: str):
    
    try:
        stats = get_user_session_stats(user_id)
        
        if stats is None:
            return JSONResponse(content={"error": "Session verisi bulunamadı"}, status_code=404)
        
        return JSONResponse(content=stats)
        
    except Exception as e:
        print(e)
        return JSONResponse(content={"error": "Session verisi alınırken hata oluştu"}, status_code=500)



if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
