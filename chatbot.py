
import config
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from google import genai
from google.genai import types
import wave

from pydantic import SecretStr

api_key_value = config.GEMINI_API_KEY or ""
llm = ChatGoogleGenerativeAI(model=config.LLM_MODEL_NAME, api_key=SecretStr(api_key_value))
client = genai.Client(api_key=config.GEMINI_API_KEY)


chat_history = []
initial_context = ""

def set_initial_context(preferences):   # burada kullanıcının tercihlerini alıyoruz ve bunları sistem mesajına ekliyoruz.
    global initial_context
    context_parts = ["Sen bir eğitim asistanısın."]
    for key, value in preferences.items():
        readable_key = key.replace('-', ' ')
        context_parts.append(f"Kullanıcının {readable_key} tercihi: {value}.")
    
    context_parts.append("Cevaplarını bu tercihlere göre, adım adım, zengin metin formatında (Markdown) ve detaylı bir şekilde açıkla. Türkçe olarak yanıt ver.")
    initial_context = " ".join(context_parts)
    
    chat_history.clear()
    chat_history.append(SystemMessage(content=initial_context))
    
    
# https://python.langchain.com/docs/tutorials/llm_chain/
def get_response(question):#temel chatbot işlevi
    chat_history.append(HumanMessage(content=question))
    response = llm.invoke(chat_history)
    chat_history.append(AIMessage(content=response.content))
    return response.content

# Linkini verdiğim örnektede aynısı yapılmış ses dosyası işlenmeden önce o yüzden burada da aynısını yapıyorum.
def wave_file(filename, pcm, channels=1, rate=24000, sample_width=2):  # https://ai.google.dev/gemini-api/docs/speech-generation?hl=tr
   with wave.open(filename, "wb") as wf:
      wf.setnchannels(channels)
      wf.setsampwidth(sample_width)
      wf.setframerate(rate)
      wf.writeframes(pcm)

def synthesize_speech(text):
    """Metni sese dönüştürür ve ses verisini bir iterator olarak döndürür."""
    try:
        # Google'ın TTS API'sini kullanarak sesi oluştur
        # https://ai.google.dev/gemini-api/docs/speech-generation?hl=tr dan bakabilirsiniz direkt oradan aldım 

        response = client.models.generate_content(
            model=config.TTS_MODEL_NAME,
            contents=text,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name='Kore',
                        )
                    )
                ),
            )
        )
        
        # yanlış yapıda donerse diye kontrol yapıyoruz
        if (response.candidates and 
            response.candidates[0].content and 
            response.candidates[0].content.parts and 
            response.candidates[0].content.parts[0].inline_data):
            data = response.candidates[0].content.parts[0].inline_data.data
        else:
            return iter([])

        file_name='out.wav'
        wave_file(file_name, data)
        return file_name
    except Exception:
        return None



# Metine dönüştürülmüş kullanıcının konu anlatımını alıyoruz ve bizim yazdığımız promptun sonuna ekliyoruz ve llm gönderiyoruz.
# metine dönüştürme işlemi transcribe_audio fonksiyonu ile yapılıyor.
def find_mistakes(text):
    try:
        prompt = (
            "Kullanıcı bir konuyu açıklamaya çalıştı. Lütfen aşağıdaki metni analiz edin, "
            "konuyla ilgili yanlış anlamaları veya hataları belirleyin ve bunları düzeltin. "
            "Kullanıcıya öğretici bir şekilde geri bildirimde bulunun. Hataları açıkça belirtin "
            "ve doğru açıklamayı detaylı bir şekilde yapın. Markdown formatında yanıt verin.\n\n"
            f"Kullanıcının açıklaması:\n{text}"
        )
        
        response = llm.invoke(prompt)
        return response.content
    except Exception:
        return "Konu analizi sırasında bir hata oluştu. Lütfen tekrar deneyin."



def generate_multiple_quiz_questions(topic, difficulty, question_count):
    try:
        prompt = f"""
        Senin görevin {question_count} adet quiz sorusu oluşturmak. Verilen kurallar ve istekleri dikkate alarak aşağıdaki konu ve zorluk seviyesine göre {question_count} farklı soru oluştur:

        Konu: {topic}
        Zorluk Seviyesi: {difficulty}
        Soru Sayısı: {question_count}

        Lütfen aşağıdaki formatta bir JSON array yanıtı döndür:
        [
            {{
                "question": "1. soru metni buraya gelecek",
                "options": [
                    "A) Birinci seçenek",
                    "B) İkinci seçenek", 
                    "C) Üçüncü seçenek",
                    "D) Dördüncü seçenek",
                    "E) Beşinci seçenek"
                ],
                "correct_answer": "Doğru cevap (A, B, C, D veya E)",
                "topic": "{topic}",
                "difficulty": "{difficulty}",
                "explanation": "Doğru cevabın kısa açıklaması"
            }},
            {{
                "question": "2. soru metni buraya gelecek",
                "options": [
                    "A) Birinci seçenek",
                    "B) İkinci seçenek", 
                    "C) Üçüncü seçenek",
                    "D) Dördüncü seçenek",
                    "E) Beşinci seçenek"
                ],
                "correct_answer": "Doğru cevap (A, B, C, D veya E)",
                "topic": "{topic}",
                "difficulty": "{difficulty}",
                "explanation": "Doğru cevabın kısa açıklaması"
            }}
            // ... {question_count} adet soru
        ]

        Önemli kurallar:
        1. Her soru, belirtilen konuyla ilgili olmalı ama farklı alt konuları kapsamalı
        2. Zorluk seviyesine uygun olmalı (Kolay: temel bilgiler, Orta: orta seviye, Zor: ileri seviye)
        3. Her soruda 5 seçenek olmalı (A, B, C, D, E)
        4. Her soruda sadece bir doğru cevap olmalı
        5. Seçenekler mantıklı ve konuyla ilgili olmalı
        6. Sorular birbirinden farklı olmalı, tekrar etmemeli
        7. JSON array formatında yanıt ver, başka bir şey ekleme
        8. Sadece JSON döndür, açıklama ekleme
        9. Tam olarak {question_count} adet soru oluştur
        """
        
        response = llm.invoke(prompt)
        content = str(response.content).strip()
        
        start_idx = content.find('[')
        end_idx = content.rfind(']') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            json_content = content[start_idx:end_idx]
            return json_content
        else:
            return None
            
    except Exception as e:
        print(f"Multiple quiz questions generation error: {e}")
        return None

def validate_quiz_answer(question_data, user_answer):
        
    try:
        correct_answer = question_data.get('correct_answer', '')
        is_correct = user_answer.upper() == correct_answer.upper()
        
        return {
            'is_correct': is_correct,
            'correct_answer': correct_answer,
            'explanation': question_data.get('explanation', ''),
            'user_answer': user_answer
        }
    except Exception:
        return None
