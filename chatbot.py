
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

def set_initial_context(preferences):
    global initial_context
    context_parts = ["Sen bir eğitim asistanısın."]
    for key, value in preferences.items():
        readable_key = key.replace('-', ' ')
        context_parts.append(f"Kullanıcının {readable_key} tercihi: {value}.")
    
    context_parts.append("Cevaplarını bu tercihlere göre, adım adım, zengin metin formatında (Markdown) ve detaylı bir şekilde açıkla. Türkçe olarak yanıt ver.")
    initial_context = " ".join(context_parts)
    
    chat_history.clear()
    chat_history.append(SystemMessage(content=initial_context))

def get_response(question):
    chat_history.append(HumanMessage(content=question))
    response = llm.invoke(chat_history)
    chat_history.append(AIMessage(content=response.content))
    return response.content

def wave_file(filename, pcm, channels=1, rate=24000, sample_width=2):
   with wave.open(filename, "wb") as wf:
      wf.setnchannels(channels)
      wf.setsampwidth(sample_width)
      wf.setframerate(rate)
      wf.writeframes(pcm)

def synthesize_speech(text):
    """Metni sese dönüştürür ve ses verisini bir iterator olarak döndürür."""
    try:
        # Google'ın TTS API'sini kullanarak sesi oluştur
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
        
        if (response.candidates and 
            response.candidates[0].content and 
            response.candidates[0].content.parts and 
            response.candidates[0].content.parts[0].inline_data):
            data = response.candidates[0].content.parts[0].inline_data.data
        else:
            print("Unexpected response structure from TTS API")
            return iter([])

        file_name='out.wav'
        wave_file(file_name, data)
        return file_name
    except Exception as e:
        print(f"Error during speech synthesis: {e}")
        print(f"Error type: {type(e)}")
        print(f"Error details: {str(e)}")
        return None


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
    except Exception as e:
        print(f"Error during mistake analysis: {e}")
        return "Konu analizi sırasında bir hata oluştu. Lütfen tekrar deneyin."
