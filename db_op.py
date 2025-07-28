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
                    create table if not exists users (
                        id integer primary key autoincrement,
                        user_id text unique not null,
                        tarih timestamp default (datetime('now', '+3 hours'))
                    )
                ''')
                
                cursor.execute('''
                    create table if not exists quiz_sonuclari (
                        id integer primary key autoincrement,
                        user_id text not null,
                        soru text not null,
                        cevap text not null,
                        dogru_cevap text not null,
                        cevap_dogru_mu boolean not null,
                        konu text not null,
                        zorluk text not null,
                        sure integer not null,
                        tarih timestamp default (datetime('now', '+3 hours')),
                        foreign key (user_id) references users(user_id)
                    )
                ''')
                
               
                cursor.execute('''
                    create table if not exists kullanici_girisleri (
                        id integer primary key autoincrement,
                        user_id text unique not null,
                        tarih timestamp default (datetime('now', '+3 hours')),
                        quiz_sayisi integer default 0,
                        sohbet_sayisi integer default 0,
                        foreign key (user_id) references users(user_id)
                    )
                ''')
                
                
                cursor.execute('''
                    create table if not exists kullanici_tercihleri (
                        id integer primary key autoincrement,
                        user_id text unique not null,
                        tercihler text not null,
                        tarih timestamp default (datetime('now', '+3 hours')),
                        foreign key (user_id) references users(user_id)
                    )
                ''')
                
                
                cursor.execute('''
                    create table if not exists kullanici_sorulari (
                        id integer primary key autoincrement,
                        user_id text not null,
                        soru_metni text not null,
                        soru_cevabi text not null,
                        soru_tipi text default 'metin',
                        tarih timestamp default (datetime('now', '+3 hours')),
                        foreign key (user_id) references users(user_id)
                    )
                ''')
                
                cursor.execute('''
                    create table if not exists kullanicilar (
                        id integer primary key autoincrement,
                        username text not null,
                        hashed_password text not null,
                        email text not null
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
                           """, (user_id, question_text, user_answer, correct_answer, is_correct, topic, difficulty, time_taken))
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
            
            connection.commit()
            return True
    except Exception as e:
        print(e)
        return False


def save_user(user_id):
    try:
        with db_ins.connection() as connection:
            cursor = connection.cursor()
            
            cursor.execute(
                '''
                insert into users
                (user_id) values (?)  
                ''',(user_id,))
            
            connection.commit()
            return True
    except Exception as e:
        print(e)
        return False

def create_user_session(user_id):
    
    try:
        with db_ins.connection() as connection:
            cursor = connection.cursor()
            cursor.execute('''
                           insert or replace into kullanici_girisleri (user_id)
                           values (?)
                           ''',(user_id,))
            connection.commit()
            return True
    except Exception as e:
        print(e)
        return False
    
def update_user_quiz_count(user_id):
    
    try:
        with db_ins.connection() as connection:
            cursor = connection.cursor()
            cursor.execute('''
                           update kullanici_girisleri
                           set quiz_sayisi = quiz_sayisi + 1
                           where user_id = ?
                           ''',(user_id,))
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
                           update kullanici_girisleri
                           set sohbet_sayisi = sohbet_sayisi + 1
                           where user_id = ?
                           ''',(user_id,))
            connection.commit()
            return True
    except Exception as e:
        print(e)
        return False
        
def generate_user_id():
    # basit bir şekilde her kullanıcı için rastgele bir id oluşturuluyor.
    return str(uuid.uuid4())

def save_user_preferences(user_id,preferences):
    try:
        with db_ins.connection() as connection:
            cursor = connection.cursor()
            preferences_s = json.dumps(preferences,ensure_ascii=False)
            cursor.execute('''
                           insert or replace into kullanici_tercihleri (user_id,tercihler)
                           values(?,?)
                           ''',(user_id,preferences_s))
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
            ''', (user_id,))
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
            ''', (user_id, question_text, question_answer, question_type))
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
            ''', (user_id,))
            return cursor.fetchall()
    except Exception as e:
        print(e)
        return False
def get_user_session_stats(user_id):
    # burada istatistiklerim kısmında gösterilen bilgileri çekiyoruz her o butona basıldığında tekrar sorgu çalıştırılıyor 
    try:
        with db_ins.connection() as connection:
            cursor = connection.cursor()
            cursor.execute('''
                select quiz_sayisi, sohbet_sayisi, tarih 
                from kullanici_girisleri where user_id = ?
            ''', (user_id,))
            result = cursor.fetchone()
            if result: # sonuç json tipinde olduğu için tek tek ayrıştırıyoruz
                return {
                    'quiz_count': result[0],
                    'chat_count': result[1], 
                    'member_since': result[2]
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
            ''', (user_id,))
            stats = cursor.fetchone()
            
            
            cursor.execute('''
                select konu, count(*) as wrong_count 
                from quiz_sonuclari 
                where user_id = ? and cevap_dogru_mu = 0 
                group by konu order by wrong_count desc
            ''', (user_id,))
            topics = dict(cursor.fetchall())
            
            cursor.execute('''
                select 
                    zorluk,
                    count(*) as total,
                    sum(case when cevap_dogru_mu = 1 then 1 else 0 end) as correct 
                from quiz_sonuclari 
                where user_id = ? 
                group by zorluk
            ''', (user_id,))
            
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