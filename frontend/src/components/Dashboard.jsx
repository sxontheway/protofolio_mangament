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
            title: '投资组合管理',
            netWorth: '总净值',
            export: '导出',
            import: '导入',
            history: '历史记录',
            updateSnapshot: '更新快照',
            addAsset: '添加资产',
            confirmImport: '警告：导入将覆盖现有数据。确定吗？',
            backToCurrent: '返回当前持仓',
            byMarket: '市场分布',
            bySector: '行业分布',
            byTicker: '个股分布',
            netWorthHistory: '净值历史'
        },
        en: {
            title: 'Portfolio Dashboard',
            netWorth: 'Net Worth',
            export: 'Export',
            import: 'Import',
            history: 'History',
            updateSnapshot: 'Update Snapshot',
            addAsset: 'Add Asset',
            confirmImport: 'Warning: Importing will OVERWRITE all existing data. Are you sure?',
            backToCurrent: 'Back to Current',
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

    const [importData, setImportData] = useState(null); // Temporary storage for imported JSON

    const handleImportClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target.result);
                    setImportData(json); // Store data and show modal
                } catch (err) {
                    alert('Invalid JSON file');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const confirmImport = async (strategy) => {
        if (!importData) return;

        if (strategy === 'full') {
            if (!window.confirm(lang === 'zh' ? '⚠️ 警告：这将清空所有现有历史记录并完全覆盖为导入的数据。确定吗？' : '⚠️ Warning: This will CLEAR ALL existing history and overwrite everything. Are you sure?')) {
                return;
            }
        }

        setLoading(true);
        try {
            await api.importData(importData, strategy);
            await fetchData();
            setImportData(null); // Close modal
        } catch (err) {
            console.error("Import failed", err);
            alert("Import failed");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !summary) return <div className="container text-center">Loading...</div>;

    return (
        <div className="container">
            {/* Import Modal */}
            {importData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', zIndex: 200,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ maxWidth: '550px', width: '90%', padding: '2rem', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <h3 className="text-xl mb-2 text-center" style={{ fontSize: '1.5rem', color: '#f8fafc' }}>
                            {lang === 'zh' ? '导入数据' : 'Import Data'}
                        </h3>
                        <p className="mb-6 text-center text-gray" style={{ fontSize: '1rem' }}>
                            {lang === 'zh'
                                ? '检测到数据文件。请选择导入方式：'
                                : 'Data file detected. Please select an import strategy:'}
                        </p>

                        <div className="flex flex-col gap-4">
                            {/* Option 1: Current Only */}
                            <button
                                onClick={() => confirmImport('current')}
                                className="btn"
                                style={{
                                    background: '#1e293b',
                                    border: '1px solid #38bdf8',
                                    padding: '1.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    textAlign: 'left',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#0f172a'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#1e293b'}
                            >
                                <div style={{ fontSize: '1.5rem', marginRight: '1rem' }}>📥</div>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#38bdf8', marginBottom: '0.25rem' }}>
                                        {lang === 'zh' ? '仅更新当前持仓' : 'Update Current Holdings'}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4' }}>
                                        {lang === 'zh'
                                            ? '推荐。保留所有历史记录。旧的当前持仓将自动备份为历史快照。'
                                            : 'Recommended. Keeps all history. Existing holdings will be auto-backed up as a snapshot.'}
                                    </div>
                                </div>
                            </button>

                            {/* Option 2: Full Overwrite */}
                            <button
                                onClick={() => confirmImport('full')}
                                className="btn"
                                style={{
                                    background: '#1e293b',
                                    border: '1px solid #ef4444',
                                    padding: '1.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    textAlign: 'left',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#0f172a'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#1e293b'}
                            >
                                <div style={{ fontSize: '1.5rem', marginRight: '1rem' }}>⚠️</div>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#ef4444', marginBottom: '0.25rem' }}>
                                        {lang === 'zh' ? '完全覆盖 (重置)' : 'Full Overwrite (Reset)'}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4' }}>
                                        {lang === 'zh'
                                            ? '危险。清空所有现有数据（包括历史记录），完全替换为导入文件的数据。'
                                            : 'Danger. Clears ALL existing data including history. Replaces everything with imported data.'}
                                    </div>
                                </div>
                            </button>
                        </div>

                        <button
                            onClick={() => setImportData(null)}
                            className="btn"
                            style={{
                                width: '100%',
                                marginTop: '1.5rem',
                                background: 'transparent',
                                border: 'none',
                                color: '#64748b',
                                textDecoration: 'underline',
                                cursor: 'pointer'
                            }}
                        >
                            {lang === 'zh' ? '取消导入' : 'Cancel Import'}
                        </button>
                    </div>
                </div>
            )}

            <div className="header">
                <div>
                    <h1 className="text-xl" style={{ fontSize: '2.2rem', margin: 0 }}>{t[lang].title}</h1>
                    <p className="text-gray" style={{ fontSize: '1.1rem' }}>
                        {t[lang].netWorth}: <span style={{ color: '#38bdf8', fontSize: '1.8rem' }}>HKD {displayData.netWorth?.toLocaleString()}</span>
                        {selectedSnapshot && (
                            <span style={{ color: '#eab308', fontSize: '1rem', marginLeft: '1rem' }}>
                                ({selectedSnapshot.date})
                                <button
                                    onClick={() => setSelectedSnapshot(null)}
                                    className="btn"
                                    style={{ marginLeft: '1rem', padding: '0.2rem 0.5rem', fontSize: '0.8rem', background: '#334155' }}
                                >
                                    {t[lang].backToCurrent}
                                </button>
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex">
                    <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="btn" style={{ marginRight: '0.5rem', background: '#64748b' }}>{lang === 'zh' ? 'EN' : '中文'}</button>
                    <button onClick={handleExport} className="btn" style={{ marginRight: '0.5rem', background: '#22c55e' }}>{t[lang].export}</button>
                    <button onClick={handleImportClick} className="btn" style={{ marginRight: '0.5rem', background: '#eab308' }}>{t[lang].import}</button>
                    <button onClick={() => setShowHistory(true)} className="btn" style={{ background: '#334155' }}>{t[lang].history}</button>
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
                            onView={(snapshot) => setSelectedSnapshot(snapshot)}
                            lang={lang}
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
                onAddAsset={() => setShowForm(true)}
                onUpdateSnapshot={handleSnapshot}
            />

            {loading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            )}
        </div>
    );
}
