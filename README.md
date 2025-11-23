# Portfolio Management Dashboard

A personal investment portfolio tracking application designed to manage and visualize your assets across multiple markets (US, HK, CN). Built with React (Frontend) and FastAPI (Backend).

## ✨ Key Features

- 📊 **Multi-Market Support**: Track assets across US, Hong Kong, and China markets
- 💰 **Real-Time Pricing**: Auto-fetch current prices and company data via Yahoo Finance
- 📈 **Time-Series Tracking**: Create snapshots to track portfolio performance over time
- 🔄 **Smart Import/Export**: Backup and restore data with flexible import strategies
- 🌐 **Bilingual Interface**: Toggle between English and Chinese (中文)
- 🎯 **Three Asset Types**: Stocks, Options (Put/Call), and Cash holdings
- 📉 **Visual Analytics**: Interactive charts for market, sector, and ticker distributions
- ⏱️ **Historical Playback**: View your portfolio state at any past date (read-only mode)

---

## 📸 UI Overview

### Main Dashboard
![Dashboard Overview](docs/images/dashboard_en.png)

1. **Net Worth History Chart** - Time-series visualization at the top
2. **Current Net Worth Display** - Large, centered card showing total value
3. **Distribution Charts** - Three pie charts (Market / Sector / Ticker)
4. **Holdings List** - Detailed table with edit/delete actions


### Historical Data
![History Chart with Tooltips](docs/images/history_chart.png)

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
1. Click **"Add Asset"** (添加资产) in the Holdings section.
2. Select **Market** (US/HK/CN) and **Asset Type** (Stock/Option/Cash).
3. Enter **Ticker** (e.g., `AAPL`, `0700.HK`, `600519.SS`).
4. Enter **Quantity** and **Cost Basis**.
   - *Note*: For "Sell Put/Call" options, select "Short" side; the system handles negative quantity logic.
5. (Optional) Leave **Company Name** and **Sector** blank to auto-fetch from market data.
6. Click **"Save"** - the asset appears immediately with live pricing.

### Creating Snapshots (Adding to History Chart)

> **Important Distinction**: Editing holdings does NOT automatically add to the chart.

- Click **"Add Snapshot"** (添加快照) to save the current portfolio state to history.
- This creates a new data point in the **"Net Worth History" chart**.
- Use this button periodically (e.g., daily, weekly) to track performance over time.

**Workflow:**
1. Edit holdings throughout the day (add, edit, delete assets)
2. At end-of-day (or whenever you want to record), click "Add Snapshot"
3. The current holdings and net worth are saved as a historical data point

### Viewing Historical Data
1. Click **"History"** button in the top-right header.
2. Browse all saved snapshots (displayed newest-first).
3. Click **"View"** on any snapshot to see the portfolio state at that date.
   - The entire dashboard switches to that historical state (read-only mode)
   - Holdings list shows only the assets from that date
   - All charts reflect that snapshot's distributions
4. Click **"← Back to Current"** to return to editing mode.

### Data Backup & Import

#### Export
- Click **"Export"** to download `portfolio_data.json`.
- File contains: Current holdings + All historical snapshots.
- Use this for backups or transferring data between devices.

#### Import

Click **"Import"** and select a JSON file. You'll see two options:

**1. 📥 Update Current Holdings** (Recommended)
- Replaces current working holdings with imported data
- **Preserves** all existing history chart data
- **Does NOT** automatically create a new snapshot
- Use case: Restore a backup or update your holdings from another source
- After importing, manually click "Add Snapshot" if you want to save this state to history

**2. ⚠️ Full Overwrite (Reset)**
- **Deletes** ALL existing data (holdings + history)
- Completely replaces with imported file's data
- Requires additional confirmation
- Use case: Starting fresh or complete data migration

### Other Features

- **Delete All Holdings**: Red button in Holdings section (clears current holdings, preserves history)
- **Delete Single Asset**: Click "Delete" on any row (with confirmation)
- **Language Toggle**: Click "EN" / "中文" in header to switch languages
- **Edit Asset**: Click "Edit" to modify quantity, cost basis, or other details

---

## 🛠 Tech Stack

### Frontend
- **React** - UI framework
- **Vite** - Fast build tool and dev server
- **Recharts** - Data visualization library
- **Pure CSS** - Custom styling with gradients and animations

### Backend
- **FastAPI** - High-performance Python web framework
- **Pydantic** - Data validation
- **yfinance** - Yahoo Finance API for market data
- **uvicorn** - ASGI server

### Data Storage
- **Local JSON** (`portfolio_data.json`) - Simple, portable, human-readable storage

---

## 📊 Data Structure

### Holdings
```json
{
  "id": "uuid",
  "ticker": "AAPL",
  "market": "US",
  "asset_type": "Stock",
  "quantity": 10,
  "cost_basis": 150.00,
  "company_name": "Apple Inc.",
  "custom_sector": "Technology"
}
```

### Snapshots (History)
```json
{
  "id": "uuid",
  "date": "2025-11-23",
  "total_net_worth_hkd": 1500000.00,
  "holdings_snapshot": [...]
}
```

---

## 🎯 Future Enhancements

- [ ] Database backend (PostgreSQL/SQLite) for scalability
- [ ] User authentication and multi-user support
- [ ] Advanced charting (candlestick, performance vs. benchmarks)
- [ ] Dividends and cash flow tracking
- [ ] Tax reporting and capital gains calculations
- [ ] Mobile responsive design improvements
- [ ] PWA support for offline access

---

## 📝 License

This project is for personal use. Feel free to fork and modify for your own portfolio tracking needs.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! This is a personal project, but suggestions for improvements are always appreciated.
