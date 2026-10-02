import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(database_url)
    print("DATABASE CONNECTION SUCCESSFUL ✅")

    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    print(cursor.fetchone())

    cursor.close()
    conn.close()

except Exception as e:
    print("DATABASE CONNECTION FAILED ❌")
    print(e)