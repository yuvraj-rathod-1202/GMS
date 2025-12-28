import os, MySQLdb
from dotenv import load_dotenv
load_dotenv()

def get_db():
    try:
        conn = MySQLdb.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            db=os.getenv("DB_NAME"),
            port=int(os.getenv("DB_PORT", 3306)),
        )
        return conn
    except:
        return None