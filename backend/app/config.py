"""
Loads settings from environment variables (or a local .env file).
Never hardcode secrets directly in code — always read them from here.
"""

import os
from dotenv import load_dotenv

load_dotenv()  # reads variables from a .env file if present


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "")

    # --- Module 2 additions ---
    GITHUB_WEBHOOK_SECRET: str = os.getenv("GITHUB_WEBHOOK_SECRET", "")
    MAX_DIFF_LINES_PER_FILE: int = int(os.getenv("MAX_DIFF_LINES_PER_FILE", "500"))


settings = Settings()