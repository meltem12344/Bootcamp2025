

## Yapılanlar 

### - pdf olusturma kısmı eklendi
### - arayüzde değişiklikler oldu


## Api keyler

1 - .env adlı bir dosya oluşturun daha sonra aşağıda ki kısımları oraya kopyalayın 

```bash
# LLM api bilgileri
GEMINI_API_KEY=Google ai studiondan alınmış api key


# rastgele bir kod şifrelemek ve şifreleri geri çözmek için 
SECRET_KEY=1q33DqYoMwm34ZqJHlSnZXq9J6EDMlv21jSNZDiGyg8wQSrpba60OAYuI9JjyzB3XJQjqegOe4QgF5G8V36R3

# SQLite Cloud bağlantı bilgileri kısımları burayı aynı şekilde bırakabilirsiniz
SQLITECLOUD_HOST=cwovl7xsnk.g4.sqlite.cloud
SQLITECLOUD_PORT=8860
SQLITECLOUD_DATABASE=kullanici-verileri
SQLITECLOUD_API_KEY=LkAOpm2PTAdhgRMIhB0rH1Cvt8sBbfRyoFXQz2rjktY
```



## Kurulum
1 - git kuruluysa bu şekilde yükelyebilirsiniz cmd'den (yüklü değilse direkt dosya olarak indirebilirsiniz) 
```bash
git clone bu projenin linki
```
daha sonra istediğiniz bir ide'de açın projeyi


2 - sizin paketlerle çakışmaması için bir sanal ortam oluşturun istemiyorsanız direkt indirebilirsiniz 4 adımdan
```bash
python -m venv env
```

3 - Terminalde sanal ortamı etkinleştirin 

```bash
.\env\Scripts\activate

```


4 - Gerekli paketleri yükleyin 
```bash
pip install -r requirements.txt
```



### 2. Ortam Değişkenleri
`env_example.txt` dosyasını `.env` olarak yeniden adlandırın ve gerekli gemini api  anahtarlarını ekleyin:



### 3. Uygulamayı Çalıştırma

```bash
uvicorn main:app --reload
```

Uygulama `http://127.0.0.1:8000` adresinde çalışır.


### YA DA

```bash
python main.py
```
Aynı şekilde uygulama `http://127.0.0.1:8000` adresinde çalışır.
## Teknik Detaylar

- **FastAPI**: Modern Python web framework
- **Google Gemini AI**: Gelişmiş AI modeli
- **SQLite Cloud**: Bulut tabanlı veritabanı





