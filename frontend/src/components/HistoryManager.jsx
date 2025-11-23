import React from 'react';
import { api } from '../services/api';

export default function HistoryManager({ history, onRefresh, onClose, setLoading }) {

    const handleDelete = async (id) => {
        // if (confirm(`Delete snapshot ? `)) {
        setLoading(true);
        try {
            await api.deleteHistory(id);
            await onRefresh();
        } finally {
            setLoading(false);
        }
        // }
    };

    return (
        <div className="card">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl">Manage History</h3>
                <button onClick={onClose} className="btn" style={{ background: 'transparent', border: '1px solid #334155' }}>Close</button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Net Worth (HKD)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(h => (
                            <tr key={h.id || h.date}>
                                <td>{h.date}</td>
                                <td>{h.total_net_worth_hkd?.toLocaleString()}</td>
                                <td>
                                    <button onClick={() => handleDelete(h.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Del</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {history.length === 0 && <p className="text-center text-gray mt-4">No history records.</p>}
            </div>
        </div>
    );
}
