# Portfolio Management Dashboard

A personal investment portfolio tracking application designed to manage and visualize your assets across multiple markets (US, HK, CN). Built with React (Frontend) and FastAPI (Backend).

## 📸 Features Overview

### 1. Comprehensive Dashboard
Visualize your Net Worth, Market Distribution, and Sector Allocation in one view.
![Dashboard](docs/images/dashboard_en.png)

### 2. Internationalization (i18n)
One-click toggle between English and Chinese (中文).
![Dashboard (Chinese)](docs/images/dashboard_zh.png)

### 3. Smart Asset Management
Support for **Stocks, Options (Put/Call), and Cash**. Auto-fetches company names, sectors, and real-time prices.
![Asset Form](docs/images/asset_form.png)

### 4. Historical Analysis & Time Travel
Track Net Worth history with precise tooltips. Use the **Snapshot Selector** to travel back and view your portfolio state at any past date.
![History Chart](docs/images/history_chart.png)

---

## 🚀 Installation & Setup

### Prerequisites
- **Python 3.8+**
- **Node.js 16+**

### 1. Backend Setup (Python/FastAPI)

```bash
# Navigate to project root
cd protofolio_mangament

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Run the backend server
uvicorn backend.main:app --reload --port 8000
```

### 2. Frontend Setup (React/Vite)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev -- --port 3000
```

Access the application at: `http://localhost:3000`

---

## 📖 User Guide

### Adding Assets
1. Click **"Add Asset"** (添加资产).
2. Select **Market** (US/HK/CN) and **Type** (Stock/Option/Cash).
3. Enter **Ticker** (e.g., `AAPL`, `0700`, `600519`).
4. Enter **Quantity** and **Cost Basis**.
   - *Note*: For "Sell Put" options, select "Short" side; the system handles negative quantity logic.
5. (Optional) Leave **Company Name** and **Sector** blank to auto-fetch them.

### Saving to History (Creating Snapshots)
- Click **"Update Snapshot (Add to Chart)"** (更新快照) to **save the current holdings state** to history.
- This creates a new data point in the **"Net Worth History" chart**.
- **Important**: Only this button adds points to the chart. Importing data does NOT automatically create snapshots.

### Viewing History
1. Click **"History"** button to view all saved snapshots.
2. Click **"View"** on any snapshot to see the portfolio state at that time (read-only).
3. Click **"← Back to Current"** to return to editing mode.

### Data Backup & Import
- **Export**: Click "Export" to download `portfolio_data.json` (includes current holdings + all history).
- **Import - Update Current Holdings**: Replaces current holdings only. **Does NOT modify history chart**. Use this to restore a backup or update your working data.
- **Import - Full Overwrite**: ⚠️ Deletes everything and replaces with imported file (use with caution).

---

## 🛠 Tech Stack

- **Frontend**: React, Vite, Recharts (Visualization), CSS Modules.
- **Backend**: FastAPI, Pydantic, yfinance (Market Data).
- **Data Storage**: Local JSON file (`portfolio_data.json`) for simplicity and portability.
