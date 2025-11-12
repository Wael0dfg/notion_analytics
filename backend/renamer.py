# backend/renamer.py

import os
import shutil
import glob
from pathlib import Path

# Paths
DOWNLOADS_DIR = Path.home() / "Downloads"
PROJECT_DIR = Path(__file__).resolve().parent.parent

# Target filename to be used by the backend
TARGET_NAME = "marketplace-purchases.csv"
TARGET_PATH = PROJECT_DIR / TARGET_NAME

def move_and_rename_csv():
    
    csv_files = sorted(
        (f for f in DOWNLOADS_DIR.glob("*.csv") if "marketplace-purchases" in f.name),
        key=os.path.getmtime,
        reverse=True
    )

    if not csv_files:
        print("[Renamer] No marketplace CSV found in Downloads.")
        return False

    latest_csv = csv_files[0]
    try:
        shutil.move(str(latest_csv), str(TARGET_PATH))
        print(f"[Renamer] Moved and renamed {latest_csv.name} → {TARGET_NAME}")
        return True
    except Exception as e:
        print(f"[Renamer] Failed to move {latest_csv.name}: {e}")
        return False

    if __name__ == "__main__":
        moved = move_and_rename_csv()
        if not moved:
            print("[Renamer] No CSV file was moved.")

