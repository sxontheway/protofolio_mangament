const API_BASE_URL = "http://localhost:8000";

export const api = {
  getHoldings: async () => {
    const res = await fetch(`${API_BASE_URL}/holdings`);
    return res.json();
  },
  addHolding: async (holding) => {
    const res = await fetch(`${API_BASE_URL}/holdings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(holding),
    });
    return res.json();
  },
  updateHolding: async (id, holding) => {
    const res = await fetch(`${API_BASE_URL}/holdings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(holding),
    });
    return res.json();
  },
  deleteHolding: async (id) => {
    const res = await fetch(`${API_BASE_URL}/holdings/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },
  getSummary: async () => {
    const res = await fetch(`${API_BASE_URL}/portfolio/summary`);
    return res.json();
  },
  createSnapshot: async () => {
    const res = await fetch(`${API_BASE_URL}/snapshot`, {
      method: "POST",
    });
    return res.json();
  },
  getHistory: async () => {
    const res = await fetch(`${API_BASE_URL}/history`);
    return res.json();
  },
  deleteHistory: async (id) => {
    const res = await fetch(`${API_BASE_URL}/history/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },
  exportData: async () => {
    const res = await fetch(`${API_BASE_URL}/export`);
    return res.json();
  },
  importData: async (data) => {
    const res = await fetch(`${API_BASE_URL}/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
