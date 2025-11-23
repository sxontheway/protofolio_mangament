import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#38bdf8', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#ec4899', '#64748b'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        const total = payload[0].payload?.total || 0;
        const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;

        return (
            <div className="card" style={{ padding: '0.5rem', border: 'none' }}>
                <p className="text-sm" style={{ marginBottom: '0.25rem' }}>{data.name}</p>
                <p className="text-sm" style={{ color: '#38bdf8', fontWeight: 600 }}>
                    {data.value.toFixed(2)} HKD ({percentage}%)
                </p>
            </div>
        );
    }
    return null;
};

export function MarketPie({ data, lang = 'zh' }) {
    const t = {
        zh: { title: '市场分布' },
        en: { title: 'By Market' }
    };
    // data: {US: 100, HK: 200...}
    const chartData = Object.keys(data).map(k => ({ name: k, value: data[k] })).filter(d => d.value > 0);
    const total = chartData.reduce((sum, d) => sum + d.value, 0);
    // Add total to each data point for percentage calculation
    const dataWithTotal = chartData.map(d => ({ ...d, total }));

    return (
        <div className="chart-container">
            <h4 className="text-center mb-2">{t[lang].title}</h4>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={dataWithTotal} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {dataWithTotal.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export function SectorPie({ data, lang = 'zh' }) {
    const t = {
        zh: { title: '行业分布' },
        en: { title: 'By Sector' }
    };
    const chartData = Object.keys(data).map(k => ({ name: k, value: data[k] })).filter(d => d.value > 0);
    const total = chartData.reduce((sum, d) => sum + d.value, 0);
    const dataWithTotal = chartData.map(d => ({ ...d, total }));

    return (
        <div className="chart-container">
            <h4 className="text-center mb-2">{t[lang].title}</h4>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={dataWithTotal} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {dataWithTotal.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export function TickerPie({ data, lang = 'zh' }) {
    const t = {
        zh: { title: '个股分布（风险敞口）' },
        en: { title: 'By Ticker (Exposure)' }
    };
    // data: {AAPL: 1000, ...}
    const chartData = Object.keys(data).map(k => ({ name: k, value: data[k] })).filter(d => d.value > 0);
    const total = chartData.reduce((sum, d) => sum + d.value, 0);
    const dataWithTotal = chartData.map(d => ({ ...d, total }));

    return (
        <div className="chart-container">
            <h4 className="text-center mb-2">{t[lang].title}</h4>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={dataWithTotal} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {dataWithTotal.map((entry, index) => (
                            // TODO: Add transparency logic if needed, but Recharts Cell fill supports rgba?
                            // For now just colors.
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export function HistoryChart({ data, lang = 'zh' }) {
    const t = {
        zh: { title: '净值历史', date: '日期', netWorth: '净资产' },
        en: { title: 'Net Worth History', date: 'Date', netWorth: 'Net Worth' }
    };

    // Custom tooltip for history chart
    const CustomHistoryTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            return (
                <div className="card" style={{ padding: '0.5rem', border: 'none' }}>
                    <p className="text-sm" style={{ marginBottom: '0.25rem' }}>{data.payload.date}</p>
                    <p className="text-sm" style={{ color: '#38bdf8', fontWeight: 600 }}>
                        HKD {data.value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
            );
        }
        return null;
    };

    // Format Y-axis to show values with K/M suffix
    const formatYAxis = (value) => {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toFixed(0);
    };

    // Add unique key to data to handle multiple snapshots on same day
    const chartData = data.map((item, index) => ({
        ...item,
        uniqueKey: `${item.date}__${index}`
    }));

    // data: [{date: '2024-01-01', total_net_worth_hkd: 10000}, ...]
    return (
        <div className="chart-container">
            <h4 className="text-center mb-2">{t[lang].title}</h4>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                        dataKey="uniqueKey"
                        stroke="#94a3b8"
                        tickFormatter={(value) => value.split('__')[0]}
                    />
                    <YAxis stroke="#94a3b8" tickFormatter={formatYAxis} />
                    <Tooltip content={<CustomHistoryTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="total_net_worth_hkd" stroke="#38bdf8" name={t[lang].netWorth} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
