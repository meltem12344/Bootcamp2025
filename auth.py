from datetime import timedelta, datetime
from typing import Annotated
from fastapi import APIRouter,Depends,HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette import status
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError
from db_op import create_user, get_user_by_username
import config
 
 
router = APIRouter(
    prefix='/auth',
    tags=['auth']
)

bcrypt_context = CryptContext(schemes=['bcrypt'],deprecated ='auto')

oauth2_bearer = OAuth2PasswordBearer(tokenUrl='auth/token')


class CreateUserRequest(BaseModel):
    username:str
    password:str
    email:str

class Token(BaseModel):
    access_token:str
    token_type:str


@router.post('/',status_code=status.HTTP_201_CREATED)
async def create_user_api(create_user_request:CreateUserRequest):
    create_user(email=create_user_request.email,
                username=create_user_request.username,
                password=bcrypt_context.hash(create_user_request.password))
    
    return JSONResponse(content={"message": "User created successfully"}, status_code=status.HTTP_201_CREATED)
    
def create_access_token(username: str, user_id: int, expires_delta: timedelta):
    encode = {'sub': username, 'id': user_id}
    expires = datetime.utcnow() + expires_delta
    encode.update({'exp': expires})
    return jwt.encode(encode, config.SECRET_KEY, algorithm=config.ALGORITHM)

def authenticate_user(username:str,password:str):
    user = get_user_by_username(username)
    if not user:
        return False
    if not bcrypt_context.verify(password, user['hashed_password']):
        return False
    return user

async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        username: str = payload.get('sub')
        user_id: int = payload.get('id')
        if username is None or user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                              detail='Token geçersiz')
        return {'username': username, 'id': user_id}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                          detail='Token geçersiz')
        
        
@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                          detail='Kullanıcı adı veya şifre hatalı')
    
    token = create_access_token(user['username'], user['id'], timedelta(minutes=480))  # 8 saat
    
    # Cookie ile token'ı ayarla
    response = JSONResponse(content={'access_token': token, 'token_type': 'bearer'})
    response.set_cookie(
        key="access_token",
        value=token,
        max_age=480*60,  # 8 saat (saniye cinsinden)
        httponly=True,   # XSS koruması
        secure=False,    # HTTPS için True yapın (development için False)
        samesite="lax"   # CSRF koruması
    )
    
    return response