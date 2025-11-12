# backend/app.py
from flask import Flask, render_template, jsonify, request
from pathlib import Path
import pandas as pd
from datetime import datetime, timedelta
import os
from renamer import move_and_rename_csv

BASE_DIR = Path(__file__).resolve().parent.parent
CSV_PATH = BASE_DIR / "marketplace-purchases.csv"

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "frontend" / "templates"),
    static_folder=str(BASE_DIR / "frontend" / "static")
)


def load_data():

    if not CSV_PATH.exists():
        return pd.DataFrame(columns=["Date", "Product name"])
    df = pd.read_csv(CSV_PATH)
    # Normalize column names a bit
    # Expecting: 'Date' and 'Product name' from your CSV
    if "Date" not in df.columns:
        df.rename(columns={c: "Date" for c in df.columns if "date" in c.lower()}, inplace=True)
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df = df.dropna(subset=["Date"])
    if "Product name" not in df.columns and "Product" in df.columns:
        df.rename(columns={"Product": "Product name"}, inplace=True)
    # Add downloads column (1 per row) if none
    if "Downloads" not in df.columns:
        df["Downloads"] = 1
    return df


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/total_downloads")
def api_total_downloads():
    df = load_data()
    if df.empty:
        return jsonify({"labels": [], "values": []})
    
    # Resample daily and count downloads
    daily_downloads = df.set_index("Date")["Downloads"].resample("D").sum().fillna(0)
    labels = daily_downloads.index.strftime("%Y-%m-%d").tolist()
    values = daily_downloads.values.tolist()
    
    return jsonify({"labels": labels, "values": values})


@app.route("/api/downloads_by_template")
def api_downloads_by_template():
    df = load_data()
    if df.empty:
        return jsonify({"labels": [], "values": []})

    df = df.dropna(subset=["Product name"])
    template_downloads = df.groupby("Product name")["Downloads"].sum().sort_values(ascending=False)
    
    labels = template_downloads.index.tolist()
    values = template_downloads.values.tolist()
    
    return jsonify({"labels": labels, "values": values})


# NEW API ENDPOINT FOR CUSTOM DATE RANGE
@app.route("/api/downloads_by_template_range")
def api_downloads_by_template_range():
    df = load_data()
    if df.empty:
        return jsonify({"labels": [], "values": []})
    
    start_date_str = request.args.get('start')
    end_date_str = request.args.get('end')
    
    if not start_date_str or not end_date_str:
        return jsonify({"labels": [], "values": []})

    start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
    end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()

    df['Date_only'] = df['Date'].dt.date
    mask = (df['Date_only'] >= start_date) & (df['Date_only'] <= end_date)
    filtered_df = df.loc[mask].dropna(subset=["Product name"])
    
    if filtered_df.empty:
        return jsonify({"labels": [], "values": []})
        
    template_downloads = filtered_df.groupby("Product name")["Downloads"].sum().sort_values(ascending=False)
    
    labels = template_downloads.index.tolist()
    values = template_downloads.values.tolist()
    
    return jsonify({"labels": labels, "values": values})

@app.route("/api/best_weekdays")
def api_best_weekdays():
    df = load_data()
    if df.empty:
        return jsonify({"labels": [], "values": []})
    
    df["Weekday"] = df["Date"].dt.day_name()
    weekday_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    weekday_downloads = df.groupby("Weekday")["Downloads"].sum().reindex(weekday_order, fill_value=0)
    labels = weekday_downloads.index.tolist()
    values = weekday_downloads.values.tolist()
    
    return jsonify({"labels": labels, "values": values})


@app.route("/api/summary")
def api_summary():

    df = load_data()
    if df.empty:
        return jsonify({"all_time": 0, "last_7_days": 0, "last_1_day": 0, "custom_range": None})

    all_time = int(df["Downloads"].sum())

    today = datetime.now().date()
    yesterday = today - timedelta(days=1)
    
    # Corrected logic to filter by date only
    df['Date_only'] = df['Date'].dt.date
    last_7_mask = df["Date_only"] >= (today - timedelta(days=6))
    last_1_mask = df["Date_only"] == yesterday
    
    last_7 = int(df.loc[last_7_mask, "Downloads"].sum())
    last_1 = int(df.loc[last_1_mask, "Downloads"].sum())

    start = request.args.get("start")  # YYYY-MM-DD
    end = request.args.get("end")
    custom_total = None
    if start and end:
        try:
            start_dt = pd.to_datetime(start).date()
            end_dt = pd.to_datetime(end).date()
            mask = (df["Date_only"] >= start_dt) & (df["Date_only"] <= end_dt)
            custom_total = int(df.loc[mask, "Downloads"].sum())
        except Exception:
            pass # Return None on parse error

    return jsonify({
        "all_time": all_time,
        "last_7_days": last_7,
        "last_1_day": last_1,
        "custom_range": custom_total
    })


if __name__ == "__main__":
    move_and_rename_csv()
    app.run(debug=True, host='0.0.0.0', port=6767)
