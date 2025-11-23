import json
import os
from typing import List, Optional
from uuid import uuid4
from datetime import date
from .models import Holding, PortfolioSnapshot

from pathlib import Path

# Use Documents folder for data storage to avoid App Translocation issues
docs_dir = Path.home() / "Documents" / "PortfolioManager"
docs_dir.mkdir(parents=True, exist_ok=True)
DATA_FILE = str(docs_dir / "portfolio_data.json")

class DataManager:
    def __init__(self):
        self.data_file = DATA_FILE
        print(f"Data file location: {self.data_file}")
        self._load_data()

    def _load_data(self):
        if not os.path.exists(self.data_file):
            # Create default demo holdings for new users
            self.data = {
                "holdings": [
                    {
                        "id": str(uuid4()),
                        "ticker": "USD",
                        "market": "US",
                        "asset_type": "Cash",
                        "quantity": 10000,
                        "cost_basis": 1.0,
                        "company_name": "US Dollar",
                        "custom_sector": None,
                        "option_type": None,
                        "strike_price": None,
                        "expiry_date": None,
                        "side": None
                    },
                    {
                        "id": str(uuid4()),
                        "ticker": "0700",
                        "market": "HK",
                        "asset_type": "Stock",
                        "quantity": 1000,
                        "cost_basis": 300.0,  # Example cost basis
                        "company_name": "Tencent Holdings",
                        "custom_sector": None,
                        "option_type": None,
                        "strike_price": None,
                        "expiry_date": None,
                        "side": None
                    }
                ],
                "snapshots": []
            }
            self._save_data()
        else:
            with open(self.data_file, "r") as f:
                self.data = json.load(f)
            # Backfill IDs for snapshots if missing
            changed = False
            for s in self.data["snapshots"]:
                if "id" not in s:
                    s["id"] = str(uuid4())
                    changed = True
            if changed:
                self._save_data()

    def _save_data(self):
        with open(self.data_file, "w") as f:
            json.dump(self.data, f, default=str, indent=4)

    def get_holdings(self) -> List[Holding]:
        return [Holding(**h) for h in self.data["holdings"]]

    def add_holding(self, holding: Holding):
        if not holding.id:
            holding.id = str(uuid4())
        self.data["holdings"].append(holding.dict())
        self._save_data()

    def update_holding(self, holding: Holding):
        for i, h in enumerate(self.data["holdings"]):
            if h["id"] == holding.id:
                self.data["holdings"][i] = holding.dict()
                self._save_data()
                return
        raise ValueError("Holding not found")

    def delete_holding(self, holding_id: str):
        self.data["holdings"] = [h for h in self.data["holdings"] if h["id"] != holding_id]
        self._save_data()

    def save_snapshot(self, snapshot: PortfolioSnapshot):
        if not snapshot.id:
            snapshot.id = str(uuid4())
            
        # Always append new snapshot as per user request to keep history of every update
        self.data["snapshots"].append(snapshot.dict())
        
        self._save_data()

    def delete_snapshot(self, snapshot_id: str):
        print(f"Deleting snapshot with ID: {snapshot_id}")
        self.data["snapshots"] = [s for s in self.data["snapshots"] if s.get("id") != snapshot_id]
        self._save_data()

    def get_history(self):
        return self.data["snapshots"]
