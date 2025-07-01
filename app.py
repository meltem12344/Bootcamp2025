# app.py

from flask import Flask, render_template, request
import google.generativeai as genai
import os
from dotenv import load_dotenv

# ortam değişkenlerini yükle
load_dotenv()

# gemini API anahtarını ayarla
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# flask uygulamasını başlat
app = Flask(__name__)

# ana sayfa (form içeren)
@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        konu = request.form["konu"]
        tarz = request.form["tarz"]
        prompt = f"{tarz} şeklinde öğrenme stiline sahip bir öğrenciye '{konu}' konusunu anlat."
        
        model = genai.GenerativeModel(model_name="models/gemini-1.5-flash")
        yanit = model.generate_content(prompt)
        return render_template("index.html", cevap=yanit.text)

    return render_template("index.html", cevap=None)

# uygulamayı çalıştır
if __name__ == "__main__":
    app.run(debug=True)