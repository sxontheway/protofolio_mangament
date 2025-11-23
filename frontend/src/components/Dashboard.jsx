import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import AssetForm from './AssetForm';
import HoldingsList from './HoldingsList';
import { MarketPie, SectorPie, TickerPie, HistoryChart } from './Charts';

import HistoryManager from './HistoryManager';

export default function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [history, setHistory] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lang, setLang] = useState('en'); // 'zh' or 'en'
    const [selectedSnapshot, setSelectedSnapshot] = useState(null); // null = current, or snapshot object

    // Calculate distributions from holdings (like backend logic)
    const calculateDistributions = (holdings) => {
        const market_dist = { US: 0, HK: 0, CN: 0, Cash: 0 };
        const sector_dist = {};
        const ticker_dist = {};

        holdings.forEach(h => {
            const value = h.market_value_hkd || 0;

            if (h.asset_type === 'Cash') {
                market_dist.Cash += value;
            } else if (h.asset_type === 'Stock') {
                market_dist[h.market] = (market_dist[h.market] || 0) + value;
                const sector = h.sector || 'Unknown';
                sector_dist[sector] = (sector_dist[sector] || 0) + value;
                ticker_dist[h.ticker] = (ticker_dist[h.ticker] || 0) + value;
            } else if (h.asset_type === 'Option') {
                market_dist[h.market] = (market_dist[h.market] || 0) + value;
                const exposure = h.exposure_value_hkd || 0;
                ticker_dist[h.ticker] = (ticker_dist[h.ticker] || 0) + exposure;
                const sector = h.sector || 'Option';
                sector_dist[sector] = (sector_dist[sector] || 0) + exposure;
            }
        });

        return { market_dist, sector_dist, ticker_dist };
    };

    // Get display data based on selected snapshot
    const getDisplayData = () => {
        if (!selectedSnapshot) {
            // Show current data
            return {
                netWorth: summary?.total_net_worth_hkd || 0,
                holdings: summary?.holdings || [],
                marketDist: summary?.market_distribution || {},
                sectorDist: summary?.sector_distribution || {},
                tickerDist: summary?.ticker_distribution || {}
            };
        } else {
            // Show snapshot data
            const distributions = calculateDistributions(selectedSnapshot.holdings_snapshot || []);
            return {
                netWorth: selectedSnapshot.total_net_worth_hkd,
                holdings: selectedSnapshot.holdings_snapshot || [],
                marketDist: distributions.market_dist,
                sectorDist: distributions.sector_dist,
                tickerDist: distributions.ticker_dist
            };
        }
    };

    const displayData = getDisplayData();

    const t = {
        zh: {
            title: '投资组合追踪',
            netWorth: '净资产',
            export: '导出',
            import: '导入',
            history: '历史',
            updateSnapshot: '更新快照',
            addAsset: '+ 添加资产',
            byMarket: '市场分布',
            bySector: '行业分布',
            byTicker: '个股分布',
            netWorthHistory: '净值历史'
        },
        en: {
            title: 'Portfolio Tracker',
            netWorth: 'Net Worth',
            export: 'Export',
            import: 'Import',
            history: 'History',
            updateSnapshot: 'Update Snapshot',
            addAsset: '+ Add Asset',
            byMarket: 'By Market',
            bySector: 'By Sector',
            byTicker: 'By Ticker',
            netWorthHistory: 'Net Worth History'
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const sum = await api.getSummary();
            setSummary(sum);
            const hist = await api.getHistory();
            setHistory(hist);
        } catch (e) {
            console.error("Failed to fetch data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = () => {
        setShowForm(false);
        setEditingAsset(null);
        fetchData();
    };

    const handleEdit = (asset) => {
        setEditingAsset(asset);
        setShowForm(true);
    };

    const handleSnapshot = async () => {
        setLoading(true);
        try {
            await api.createSnapshot();
            await fetchData();
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const data = await api.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `portfolio_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Export failed', e);
            alert('Export failed. Please try again.');
        }
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!confirm('Warning: Importing will OVERWRITE all existing data. Are you sure?')) {
                return;
            }

            try {
                const text = await file.text();
                const data = JSON.parse(text);
                await api.importData(data);
                alert('Data imported successfully!');
                fetchData();
            } catch (err) {
                console.error('Import failed', err);
                alert('Import failed. Please check the file format.');
            }
        };
        input.click();
    };

    if (loading && !summary) return <div className="container text-center">Loading...</div>;

    return (
        <div className="container">
            <div className="header">
                <div>
                    <h1 className="text-xl" style={{ fontSize: '2.2rem', margin: 0 }}>{t[lang].title}</h1>
                    <p className="text-gray" style={{ fontSize: '1.1rem' }}>
                        {t[lang].netWorth}: <span style={{ color: '#38bdf8', fontSize: '1.8rem' }}>HKD {displayData.netWorth?.toLocaleString()}</span>
                        {selectedSnapshot && <span style={{ color: '#eab308', fontSize: '1rem', marginLeft: '1rem' }}>({selectedSnapshot.date})</span>}
                    </p>

                    {/* Snapshot Selector */}
                    <div style={{ marginTop: '0.5rem' }}>
                        <select
                            value={selectedSnapshot?.id || 'current'}
                            onChange={(e) => {
                                if (e.target.value === 'current') {
                                    setSelectedSnapshot(null);
                                } else {
                                    const snapshot = history.find(h => h.id === e.target.value);
                                    setSelectedSnapshot(snapshot);
                                }
                            }}
                            style={{
                                padding: '0.35rem 0.65rem',
                                fontSize: '0.9rem',
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '4px',
                                color: '#f1f5f9'
                            }}
                        >
                            <option value="current">{lang === 'zh' ? '📊 当前持仓' : '📊 Current Holdings'}</option>
                            {history.map(h => (
                                <option key={h.id} value={h.id}>
                                    📅 {h.date} - HKD {h.total_net_worth_hkd?.toLocaleString()}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex">
                    <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="btn" style={{ marginRight: '0.5rem', background: '#64748b' }}>{lang === 'zh' ? 'EN' : '中文'}</button>
                    <button onClick={handleExport} className="btn" style={{ marginRight: '0.5rem', background: '#22c55e' }}>{t[lang].export}</button>
                    <button onClick={handleImport} className="btn" style={{ marginRight: '0.5rem', background: '#eab308' }}>{t[lang].import}</button>
                    <button onClick={() => setShowHistory(true)} className="btn" style={{ marginRight: '0.5rem', background: '#334155' }}>{t[lang].history}</button>
                    <button onClick={handleSnapshot} className="btn">{t[lang].updateSnapshot}</button>
                    <button onClick={() => setShowForm(true)} className="btn">{t[lang].addAsset}</button>
                </div>
            </div>

            {showForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ width: '100%', maxWidth: '600px' }}>
                        <AssetForm
                            onSave={handleSave}
                            onClose={() => { setShowForm(false); setEditingAsset(null); }}
                            initialData={editingAsset}
                            lang={lang}
                        />
                    </div>
                </div>
            )}

            {showHistory && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ width: '100%', maxWidth: '600px' }}>
                        <HistoryManager
                            history={history}
                            onRefresh={fetchData}
                            onClose={() => setShowHistory(false)}
                            setLoading={setLoading}
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-3 mb-4">
                <div className="card">
                    <MarketPie data={displayData.marketDist} lang={lang} />
                </div>
                <div className="card">
                    <SectorPie data={displayData.sectorDist} lang={lang} />
                </div>
                <div className="card">
                    <TickerPie data={displayData.tickerDist} lang={lang} />
                </div>
            </div>

            <div className="grid grid-cols-1 mb-4">
                <div className="card">
                    <HistoryChart data={history} lang={lang} />
                </div>
            </div>

            <HoldingsList
                holdings={displayData.holdings}
                onEdit={selectedSnapshot ? null : handleEdit}
                onRefresh={fetchData}
                lang={lang}
                readOnly={!!selectedSnapshot}
            />

            {loading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            )}
        </div>
    );
}
