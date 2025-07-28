### login register sayfasını şu anda ana sayfada ekli değil oraya ulaşmak için adresin sonuna /login yazabilirsiniz arka planda çalışıyor ama arayüze eklemedim henüz.


## Yapılanlar 

### - Mini quiz eklendi
### - Database ile bağlantılar eklendi (daha fazla da eklenecek)
### - Kullanıcı sistemi eklendi

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





