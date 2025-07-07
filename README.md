### **Frontend tarafını llmlere yaptrıdım o yüzden birkaç hata var. Daha fazla da olabilir**

## Proje Özellikleri

- **Kişiselleştirilmiş Öğrenme**: Kullanıcıların öğrenme stillerini ve tercihlerini belirleyen anket sistemi
- **İnteraktif Chatbot**: Kullanıcı sorularına Markdown formatında detaylı ve kişiselleştirilmiş yanıtlar
- **Ses Tanıma**: Kullanıcıların sesli sorularını metne dönüştürme özelliği
- **Sesli Anlatım**: Metin yanıtlarını sesli olarak dinleme imkanı sunan TTS (Text-to-Speech) entegrasyonu
- **Konu Anlatım Değerlendirmesi**: Kullanıcıların anlattıkları konuları LLM teknolojisi ile analiz edip geri bildirim verme


| Aşama No | Aşama Başlığı                     | Açıklama                                                                   | Durum          |
|----------|-----------------------------------|----------------------------------------------------------------------------|----------------|
| 1        | Temel Soru-Cevap Sistemi         | Kullanıcı sorularına kişiselleştirilmiş yanıtlar verme                    | ✅ Tamamlandı   |
| 2        | Ses Tanıma Özelliği              | Kullanıcıların sesli sorularını metne dönüştürme                          | ✅ Tamamlandı   |
| 3        | TTS Servisi Entegrasyonu         | Sesli anlatım için tts servisi yapıalcak                                  | ✅ Tamamlandı   |
| 4        | Kullanıcı Konu Anlatımı | Kullanıcıdan konuyu anlatmasını istemek ve anlatılan konuyu llmler aracılığı ile yanlışlarını bulmak       | ✅ Tamamlandı     |


## Tech Stack

- **FastAPI**: Web uygulaması framework'ü
- **LangChain**: LLM entegrasyonu için
- **Google Gemini API**: Doğal dil işleme ve chatbot yanıtları
- **google**: LLM entegrasyonu için özellikle ses kısmında
- **Bootstrap**: Frontend stil ve arayüz tasarımı



## Resimler 
### Karşılama Sayfası
![Karşılama Sayfası](/ekran-goruntuleri/Screenshot_7-7-2025_18115_127.0.0.1.jpeg)
### Boş sesli değerlendirme ekranı
![Boş sesli değerlendirme ekranı](/ekran-goruntuleri/Screenshot_7-7-2025_18133_127.0.0.1.jpeg)
### Boş soru sorma ekranı 
![Boş soru sorma ekranı ](/ekran-goruntuleri/Screenshot_7-7-2025_18124_127.0.0.1.jpeg)
### soru sorma ekranı
![soru sorma ekranı](/ekran-goruntuleri/Screenshot_7-7-2025_18043_127.0.0.1.jpeg)
### sesli değerlendirme ekranı
![sesli değerlendirme ekranı](/ekran-goruntuleri/Screenshot_7-7-2025_174314_127.0.0.1.jpeg)