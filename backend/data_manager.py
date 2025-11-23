import json
import os
from typing import List, Optional
from uuid import uuid4
from datetime import date
from .models import Holding, PortfolioSnapshot

DATA_FILE = "portfolio_data.json"

class DataManager:
    def __init__(self):
        self.data_file = DATA_FILE
        self._load_data()

    def _load_data(self):
        if not os.path.exists(self.data_file):
            self.data = {"holdings": [], "snapshots": []}
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
