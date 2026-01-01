from faker import Faker
import bcrypt
from utils.db import get_db

def request_password_reset(id: int):
    
    # generate random strong password
    fake = Faker()
    new_password = fake.password(length=16, special_chars=False, digits=True, upper_case=True, lower_case=True)
    # change password_hash in db
    password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db = get_db()
    if not db:
        return "Database connection error"
    
    cur = db.cursor()
    
    cur.execute(
        "UPDATE users SET password_hash = %s WHERE id = %s",
        (password_hash, id,)
    )
    db.commit()
    
    # send request to /notify/email endpoint
    
    return None