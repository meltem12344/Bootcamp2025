import json
import sqlitecloud as sql
import config
import uuid
from contextlib import contextmanager
import threading


class DatabaseOp:
    """Şimdi burada anlayabildiğim kadar açıklayacağım biz bu sınıfı ilerde db = DatabaseOp()
       diyerek kullandığımızda her seferinde normal şartlarda __init__ methodu çalışıyor zaten constructors
       diyoruz buna. Biz bunu her yaptığımızda init fonsksiyonunda tabloları oluşturduğumuz için 
       ileride her seferinde tablo veri tabanında varmı yokmu diye kontrol yapacak bu yüzden çok istek atmış olacak
       bunu önlemek için öncesinde daha önce çağırıp çağırmadığımızı kaydediyoruz bu şekilde 
       tekrar tekrar aynı tablolar varmı diye bakmıyor ben şuan sadece 4-5 tablo yapacağım ama ileride 
       tablo sayısı artığında her seferinde bunu yapması beklemeyi arttırabilir 
       bende bunu daha yeni öğreniyorum o yüzden internet üzerindeki örneklerden gittim bunu yaparken 
       açıklamamda çok doğru olmayabilir anlayabildiğim kadar anlattım.
       
       lockMulti kısmı bende de yok orayı ilk denemelerde çalışmayınca hata alınca yapay zeka ekledi
         
    """
    
    instance = None # daha önce oluşturulan kısmı saklayacak olan değişken
    lockMulti = threading.Lock()
    tables_created = False # bu da tablolar oluşturuldu mu onu tutacak değişken
    
    # yukarıda dediğim gibi bu kısımı açıklmaya çalıştım ama her kodu tek tek bende tam bilmiyorum.
    def __new__(cls):
        if cls.instance is None:
            with cls.lockMulti:
                if cls.instance is None:
                    cls.instance = super(DatabaseOp, cls).__new__(cls)
                    cls.instance.finit = False
        return cls.instance
    
    def __init__(self):
        if not self.finit:
            self.conn_str = config.SQLITECLOUD_CONNECTION_STRING
            self.finit = True
            self.is_tables_created()
            
        
    @contextmanager   
    def connection(self):
        connection = None
        try:
            connection = sql.connect(self.conn_str) # direkt bağlanıyoruz 
            yield connection # burada yield return gibi birşey aslında sadece 
                             # biz bu fonksiyonu with ile çağıracağız yukarıda yaptığımız 
                             # @contextmanager bizim için kaynakları sonlandıracak ve 
                             # bilgisayarın ve sunucunun yorulmaısnı engelleyecek 
                             # bende daha yeni yeni öğreniyorum bu yönetim işini o yüzden 
                             # tam açıklayamamış olaiblirim ya da hatalı açıklamış olabilirim.
        except Exception as e:
            print(e)
            if connection:
                connection.rollback() # daha önceki işlemleri geri alıyoruz 
            raise # hata vermesi için 
        finally:
            if connection:
                connection.close() # en son olarak bağlantıyı sonlandırıyoruz.
    
    def is_tables_created(self):
        if not DatabaseOp.tables_created:
            with self.lockMulti:
                if not DatabaseOp.tables_created:
                    self.create_tables()
                    DatabaseOp.tables_created = True 
    
    
    def create_tables(self):
        try:
            with self.connection() as connection:
                cursor = connection.cursor()
                
                
                cursor.execute('''
                    create table if not exists kullanicilar (
                        id integer primary key autoincrement,
                        username text unique not null,
                        hashed_password text not null,
                        email text unique not null,
                        tarih timestamp default (datetime('now', '+3 hours'))
                    )
                ''')
                
                cursor.execute('''
                    create table if not exists quiz_sonuclari (
                        id integer primary key autoincrement,
                        user_id integer not null,
                        soru text not null,
                        cevap text not null,
                        dogru_cevap text not null,
                        cevap_dogru_mu boolean not null,
                        konu text not null,
                        zorluk text not null,
                        sure integer not null,
                        tarih timestamp default (datetime('now', '+3 hours')),
                        foreign key (user_id) references kullanicilar(id)
                    )
                ''')
                
               
                cursor.execute('''
                    create table if not exists kullanici_girisleri (
                        id integer primary key autoincrement,
                        user_id integer not null,
                        giris_tarihi timestamp default (datetime('now', '+3 hours')),
                        ip_adresi text,
                        user_agent text,
                        foreign key (user_id) references kullanicilar(id)
                    )
                ''')
                
                cursor.execute('''
                    create table if not exists kullanici_istatistikleri (
                        id integer primary key autoincrement,
                        user_id integer unique not null,
                        toplam_chat_sayisi integer default 0,
                        toplam_quiz_sayisi integer default 0,
                        toplam_giris_sayisi integer default 0,
                        son_aktivite timestamp default (datetime('now', '+3 hours')),
                        foreign key (user_id) references kullanicilar(id)
                    )
                ''')
                
                
                cursor.execute('''
                    create table if not exists kullanici_tercihleri (
                        id integer primary key autoincrement,
                        user_id integer unique not null,
                        tercihler text not null,
                        tarih timestamp default (datetime('now', '+3 hours')),
                        foreign key (user_id) references kullanicilar(id)
                    )
                ''')
                
                
                cursor.execute('''
                    create table if not exists kullanici_sorulari (
                        id integer primary key autoincrement,
                        user_id integer not null,
                        soru_metni text not null,
                        soru_cevabi text not null,
                        soru_tipi text default 'metin',
                        tarih timestamp default (datetime('now', '+3 hours')),
                        foreign key (user_id) references kullanicilar(id)
                    )
                ''')
                connection.commit()
                 
        except Exception as e:
            raise e


db_ins = DatabaseOp()



def save_quiz_result(user_id,question_text,user_answer,correct_answer,is_correct,topic,difficulty,time_taken):
    
    try:
        with db_ins.connection() as connection:
            cursor = connection.cursor()
            
            cursor.execute("""
                           insert into quiz_sonuclari
                           (user_id, soru, cevap, dogru_cevap, cevap_dogru_mu, konu, zorluk, sure)
                           values (?, ?, ?, ?, ?, ?, ?, ?)
                           """, (int(user_id), question_text, user_answer, correct_answer, is_correct, topic, difficulty, time_taken))
            connection.commit()
            return True
    except Exception as e:
        print(e)
        return False
    

def create_user(username,password,email):
    try:
        with db_ins.connection() as connection:
            cursor = connection.cursor()
            
            cursor.execute("""
                           insert or replace into kullanicilar
                           (username, hashed_password, email)
                           values (?, ?, ?)
                           """,(username,password,email))
            
            # Oluşturulan kullanıcının ID'sini al
            cursor.execute("""
                           select id from kullanicilar 
                           where username = ?
                           """,(username,))
            
            user_id = cursor.fetchone()[0]
            
            # Kullanıcı için otomatik olarak istatistik kaydı oluştur
            cursor.execute("""
                           insert or replace into kullanici_istatistikleri (user_id)
                           values (?)
                           """,(user_id,))
            
            connection.commit()
            return user_id
    except Exception as e:
        print(e)
        return False



def update_user_quiz_count(user_id):
    try:
        with db_ins.connection() as connection:
            cursor = connection.cursor()
            cursor.execute('''
                           update kullanici_istatistikleri
                           set toplam_quiz_sayisi = toplam_quiz_sayisi + 1,
                               son_aktivite = datetime('now', '+3 hours')
                           where user_id = ?
                           ''',(int(user_id),))
            connection.commit()
            return True
    except Exception as e:
        print(e)
        return False

def update_user_chat_count(user_id):
    try:
        with db_ins.connection() as connection:
            cursor = connection.cursor()
            cursor.execute('''
                           update kullanici_istatistikleri
                           set toplam_chat_sayisi = toplam_chat_sayisi + 1,
                               son_aktivite = datetime('now', '+3 hours')
                           where user_id = ?
                           ''',(int(user_id),))
            connection.commit()
            return True
    except Exception as e:
        print(e)
        return False
        


def save_user_preferences(user_id,preferences):
    try:
        with db_ins.connection() as connection:
            cursor = connection.cursor()
            preferences_s = json.dumps(preferences,ensure_ascii=False)
            cursor.execute('''
                           insert or replace into kullanici_tercihleri (user_id,tercihler)
                           values(?,?)
                           ''',(int(user_id),preferences_s))
            connection.commit()
            return True
    except Exception as e:
        print(e)
        return False

def get_user_preferences(user_id):
    
    try:
        with db_ins.connection() as connection:
            cursor = connection.cursor()
            cursor.execute('''
                select tercihler from kullanici_tercihleri where user_id = ?
            ''', (int(user_id),))
            result = cursor.fetchone()
            if result:
                return json.loads(result[0])
            return None
    except Exception as e:
        print(e)
        return None
    
def check_database_health():
    try:
        with db_ins.connection() as connection:
            cursor = connection.cursor()
            cursor.execute("select 1-1")
            return True
    except Exception as e:
        print(e)
        return False
    

def save_user_question(user_id, question_text, question_answer, question_type='metin'):
    # soru sor kısmındaki işlemleri kaydediyoruz 
    try:
        with db_ins.connection() as connection:
            cursor = connection.cursor()
            cursor.execute('''
                insert into kullanici_sorulari (user_id, soru_metni, soru_cevabi, soru_tipi)
                values (?, ?, ?, ?)
            ''', (int(user_id), question_text, question_answer, question_type))
            connection.commit()
            return True
    except Exception as e:
        print(e)
        return False
    
def get_user_questions(user_id):
    # kullanıcının sorduğu soruları getiriyoruz
    try:
        with db_ins.connection() as connection:
            cursor = connection.cursor()
            cursor.execute('''
                select soru_metni, soru_cevabi, soru_tipi, tarih 
                from kullanici_sorulari WHERE user_id = ? 
                order by tarih desc
            ''', (int(user_id),))
            return cursor.fetchall()
    except Exception as e:
        print(e)
        return False
    
    
def get_user_session_stats(user_id):
    # burada istatistiklerim kısmında gösterilen bilgileri çekiyoruz her o butona basıldığında tekrar sorgu çalıştırılıyor 
    try:
        with db_ins.connection() as connection:
            cursor = connection.cursor()
            
            # İstatistik bilgilerini al
            cursor.execute('''
                select toplam_quiz_sayisi, toplam_chat_sayisi, toplam_giris_sayisi, son_aktivite 
                from kullanici_istatistikleri where user_id = ?
            ''', (int(user_id),))
            stats_result = cursor.fetchone()
            
            # Kullanıcının üye olma tarihini al
            cursor.execute('''
                select tarih from kullanicilar where id = ?
            ''', (int(user_id),))
            member_since = cursor.fetchone()[0]
            
            if stats_result: # sonuç json tipinde olduğu için tek tek ayrıştırıyoruz
                return {
                    'quiz_count': stats_result[0],
                    'chat_count': stats_result[1], 
                    'login_count': stats_result[2],
                    'last_activity': stats_result[3],
                    'member_since': member_since
                }
            return None
    except Exception as e:
        print(e)
        return None
    
    
    
def get_user_performance(user_id):
    try:
        with db_ins.connection() as connection:
            cursor = connection.cursor()
            
            cursor.execute('''
                select 
                    count(*) as total_questions,
                    sum(case when cevap_dogru_mu = 1 then 1 else 0 end) as correct_answers,
                    sum(case when cevap_dogru_mu = 0 then 1 else 0 end) as incorrect_answers 
                from quiz_sonuclari where user_id = ?
            ''', (int(user_id),))
            stats = cursor.fetchone()
            
            
            cursor.execute('''
                select konu, count(*) as wrong_count 
                from quiz_sonuclari 
                where user_id = ? and cevap_dogru_mu = 0 
                group by konu order by wrong_count desc
            ''', (int(user_id),))
            topics = dict(cursor.fetchall())
            
            cursor.execute('''
                select 
                    zorluk,
                    count(*) as total,
                    sum(case when cevap_dogru_mu = 1 then 1 else 0 end) as correct 
                from quiz_sonuclari 
                where user_id = ? 
                group by zorluk
            ''', (int(user_id),))
            
            difficulty_stats = {}
            for row in cursor.fetchall():
                difficulty_stats[row[0]] = {
                    'total': row[1],
                    'correct': row[2]
                }
            
            return {
                'total_questions': stats[0] if stats else 0,
                'correct_answers': stats[1] if stats else 0,
                'incorrect_answers': stats[2] if stats else 0,
                'topics': topics,
                'difficulty_stats': difficulty_stats
            }
            
    except Exception as e:
        print(e)
        return None
    


def get_user_by_username(username):
    try:
        with db_ins.connection() as connection:
            cursor = connection.cursor()
            cursor.execute('''
                           select id, username, hashed_password, email 
                           from kullanicilar 
                           where username = ?
                           ''', (username,))
            result = cursor.fetchone()
            if result:
                return {
                    'id': result[0],
                    'username': result[1], 
                    'hashed_password': result[2],
                    'email': result[3]
                }
            return None
    except Exception as e:
        print(e)
        return None

def save_user_login(user_id, ip_address=None, user_agent=None):
    """Kullanıcının giriş yaptığı zamanı ve bilgilerini kaydeder"""
    try:
        with db_ins.connection() as connection:
            cursor = connection.cursor()
            
            # Giriş kaydını ekle
            cursor.execute('''
                insert into kullanici_girisleri (user_id, ip_adresi, user_agent)
                values (?, ?, ?)
            ''', (int(user_id), ip_address, user_agent))
            
            # İstatistik tablosundaki giriş sayısını güncelle
            cursor.execute('''
                update kullanici_istatistikleri
                set toplam_giris_sayisi = toplam_giris_sayisi + 1,
                    son_aktivite = datetime('now', '+3 hours')
                where user_id = ?
            ''', (int(user_id),))
            
            connection.commit()
            return True
    except Exception as e:
        print(e)
        return False


from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import simpleSplit
from reportlab.lib import colors
from io import BytesIO

# Font kaydı (DejaVu Türkçe destekler)
pdfmetrics.registerFont(TTFont("DejaVu", "fonts/DejaVuSans.ttf"))

# Akıllı satır kaydırıcı
def draw_wrapped_text(c, text, x, y, max_width, line_height, font_name="DejaVu", font_size=11, font_style=None):
    # Metni satırlara böler
    lines = simpleSplit(text, font_name, font_size, max_width)
    for line in lines:
        # Sayfa sonu kontrolü
        if y < 60:
            c.showPage()
            c.setFont(font_name, font_size)
            y = A4[1] - 50
        # Yazı tipi ayarla
        if font_style == "bold":
            c.setFont(font_name, font_size)
        elif font_style == "italic":
            c.setFont(font_name, font_size)
        else:
            c.setFont(font_name, font_size)
        c.drawString(x, y, line)
        y -= line_height
    return y

# Soru kutusu çizimi
def draw_question_box(c, text, x, y, width, height, padding=5):
    # Arkaplan rengi ve kutu çizimi
    c.setFillColor(colors.lightblue)
    c.rect(x, y - height + padding, width, height, fill=1, stroke=0)
    c.setFillColor(colors.black)
    c.setFont("DejaVu", 12)
    lines = simpleSplit(text, "DejaVu", 12, width - 2 * padding)
    for i, line in enumerate(lines):
        c.drawString(x + padding, y - (i * 14), line)
    return y - height - 5  # kutudan sonra boşluk bırak

# Ana PDF üretimi
def generate_user_pdf(user_id):
    try:
        questions = get_user_questions(user_id)

        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        margin = 50
        y = height - margin
        line_height = 14

        # Başlık
        c.setFont("DejaVu", 16)
        y = draw_wrapped_text(c, "📄 Kullanıcı Raporu", margin, y, width - 2 * margin, line_height)

        # Chat Geçmişi Başlığı
        y -= 20
        c.setFont("DejaVu", 13)
        y = draw_wrapped_text(c, "💬 Chat Geçmişi", margin, y, width - 2 * margin, line_height)

        c.setFont("DejaVu", 11)

        for q in questions:
            soru = q[0]
            cevap = q[1]
            tipi = q[2]

            y -= 10
            # SORU: kutu içinde büyük puntolu
            box_width = width - 2 * margin
            box_height = 40 if len(soru) < 150 else 60
            y = draw_question_box(c, f"Soru ({tipi}): {soru}", margin, y, box_width, box_height)

            # CEVAP: markdown benzeri başlık ayrımı
            lines = cevap.split("\n")
            for line in lines:
                line = line.strip().replace("*", "")  # Tüm * işaretlerini temizle
                if line.startswith("### "):
                    y -= 6
                    y = draw_wrapped_text(c, line[4:], margin + 10, y, width - 2 * margin - 10, line_height + 2, font_size=13, font_style="bold")
                elif line.startswith("#### "):
                    y -= 4
                    y = draw_wrapped_text(c, line[5:], margin + 15, y, width - 2 * margin - 15, line_height, font_size=11, font_style="italic")
                elif line:
                    y = draw_wrapped_text(c, line, margin + 20, y, width - 2 * margin - 20, line_height)
                y -= 2

            y -= 10  # soru-cevap arası boşluk

            # Sayfa sonu kontrol
            if y < 100:
                c.showPage()
                y = height - margin

        c.save()
        buffer.seek(0)
        return buffer

    except Exception as e:
        print(f"PDF oluşturulurken hata: {e}")
        return None









""""
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.pdfbase import pdfmetrics
    from io import BytesIO
    import os

    pdfmetrics.registerFont(TTFont("DejaVu", "fonts/DejaVuSans.ttf"))

    def generate_user_pdf(user_id):
        try:
            questions = get_user_questions(user_id)
            with db_ins.connection() as connection:
                cursor = connection.cursor()
                cursor.execute('''
                    SELECT soru, cevap, dogru_cevap 
                    FROM quiz_sonuclari 
                    WHERE user_id = ?
                    ORDER BY tarih DESC
                ''', (int(user_id),))
                quiz_results = cursor.fetchall()

            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=60, bottomMargin=60)
            styles = getSampleStyleSheet()

            # ✅ Özel stiller
            styles.add(ParagraphStyle(name='MyTitle', fontName='DejaVu', fontSize=18, leading=22, spaceAfter=20, alignment=1))
            styles.add(ParagraphStyle(name='Heading', fontName='DejaVu', fontSize=14, leading=18, spaceAfter=12, textColor=colors.darkblue))
            styles.add(ParagraphStyle(name='SubHeading', fontName='DejaVu', fontSize=12, leading=16, spaceAfter=6, textColor=colors.darkgreen))
            styles.add(ParagraphStyle(name='Body', fontName='DejaVu', fontSize=11, leading=15, spaceAfter=4))
            styles.add(ParagraphStyle(name='Box', fontName='DejaVu', fontSize=11, backColor=colors.whitesmoke, borderPadding=6, spaceBefore=6, spaceAfter=12))

            content = []

            # 💬 Chat
            content.append(Paragraph("💬 Chat Geçmişi", styles['Heading']))
            if questions:
                for idx, q in enumerate(questions):
                    soru = q[0]
                    cevap = q[1]
                    tipi = q[2]
                    text = f"<b>Soru {idx+1} ({tipi}):</b><br/>{soru}<br/><br/><b>Cevap:</b><br/>{cevap}"
                    content.append(Paragraph(text, styles['Box']))
            else:
                content.append(Paragraph("Kayıtlı chat bulunamadı.", styles['Body']))

            content.append(PageBreak())

            # 🧪 Quiz
            content.append(Paragraph("🧪 Quiz Sonuçları", styles['Heading']))
            if quiz_results:
                for idx, row in enumerate(quiz_results):
                    soru, cevap, dogru = row
                    text = f"<b>Soru {idx+1}:</b><br/>{soru}<br/><br/><b>✅ Doğru Cevap:</b> {dogru}<br/><b>❌ Kullanıcının Cevabı:</b> {cevap}"
                    content.append(Paragraph(text, styles['Box']))
            else:
                content.append(Paragraph("Quiz çözülmemiş.", styles['Body']))

            doc.build(content)
            buffer.seek(0)
            return buffer

        except Exception as e:
            print(f"PDF oluşturulurken hata: {e}")
            return None
"""