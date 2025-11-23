import React from 'react';
import { api } from '../services/api';

export default function HistoryManager({ history, onRefresh, onClose, setLoading, onView, lang = 'en' }) {
    const t = {
        zh: {
            manageHistory: '管理历史快照',
            close: '关闭',
            date: '日期',
            netWorth: '净值 (HKD)',
            actions: '操作',
            view: '查看',
            delete: '删除',
            confirmDelete: '确定要删除这个快照吗？',
            noHistory: '暂无历史记录'
        },
        en: {
            manageHistory: 'Manage History',
            close: 'Close',
            date: 'Date',
            netWorth: 'Net Worth (HKD)',
            actions: 'Actions',
            view: 'View',
            delete: 'Delete',
            confirmDelete: 'Are you sure you want to delete this snapshot?',
            noHistory: 'No history records.'
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t[lang].confirmDelete)) {
            setLoading(true);
            try {
                await api.deleteHistory(id);
                await onRefresh();
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="card">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl">{t[lang].manageHistory}</h3>
                <button onClick={onClose} className="btn" style={{ background: 'transparent', border: '1px solid #334155' }}>{t[lang].close}</button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table>
                    <thead>
                        <tr>
                            <th>{t[lang].date}</th>
                            <th>{t[lang].netWorth}</th>
                            <th>{t[lang].actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(h => (
                            <tr key={h.id || h.date}>
                                <td>{h.date}</td>
                                <td>{h.total_net_worth_hkd?.toLocaleString()}</td>
                                <td>
                                    <button
                                        onClick={() => { onView(h); onClose(); }}
                                        className="btn"
                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginRight: '0.5rem', background: '#38bdf8' }}
                                    >
                                        {t[lang].view}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(h.id)}
                                        className="btn btn-danger"
                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                    >
                                        {t[lang].delete}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {history.length === 0 && <p className="text-center text-gray mt-4">{t[lang].noHistory}</p>}
            </div>
        </div>
    );
}
