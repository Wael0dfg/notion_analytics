# notion_analytics

A simple tool for Notion creators to see and visualize analytics of their templates.

---

## 💡 What It Does

1. You download the official Notion **Marketplace purchases CSV** from the Notion Creators website.
2. The script automatically finds that CSV in your **Downloads folder** (works on Windows, macOS, or Linux).
3. It moves and renames it to this folder as `marketplace-purchases.csv`.
4. It starts a local **webpage** showing charts and stats about your template downloads.

---

## ⚙️ How to Use

### 1. Clone the repo
```bash
git clone https://github.com/Wael0dfg/notion_analytics.git
cd notion_analytics
```

### 2. Install requirements
```bash
pip install -r requirements.txt
```

### 3. Run the app
```bash
python backend/app.py
```

Then open your browser at:  
👉 **http://127.0.0.1:6767**

---

## 📊 Features
- Automatically detects and moves your Notion CSV file.
- Works on Windows, macOS, and Linux.
- Shows your total downloads over time.
- Compares downloads between templates.
- Lets you select custom date ranges.
- Displays best-performing weekdays.

---

## 🧩 Project Structure
```
notion_analytics/
├─ backend/
│  ├─ app.py          # Main Flask app
│  ├─ renamer.py      # Moves and renames the CSV
├─ frontend/
│  ├─ templates/      # HTML templates
│  ├─ static/         # JS, CSS, charts
├─ marketplace-purchases.csv
├─ requirements.txt
├─ README.md
```

---

## 🧠 Notes
- Default CSV path: `~/notion_analytics/marketplace-purchases.csv`
- To change it, edit `renamer.py` or set your own folder path.
- The webpage refreshes automatically when new data is found.

---
