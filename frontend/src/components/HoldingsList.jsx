import React from 'react';
import { api } from '../services/api';

export default function HoldingsList({ holdings, onEdit, onRefresh, lang = 'en', readOnly = false, onAddAsset, onUpdateSnapshot }) {
    const t = {
        zh: {
            edit: '编辑',
            delete: '删除',
            confirmDelete: '确定要删除这个资产吗？',
            holdings: '持仓明细',
            ticker: '代码',
            company: '公司名',
            market: '市场',
            type: '类型',
            quantity: '数量',
            cost: '成本',
            currentPrice: '现价',
            marketValue: '市值',
            profitLoss: '盈亏',
            profitLossPercent: '盈亏%',
            sector: '行业',
            actions: '操作',
            stock: '股票',
            cash: '现金',
            option: '期权',
            sell: '卖出',
            buy: '买入',
            put: '看跌',
            call: '看涨',
            addAsset: '添加资产',
            updateSnapshot: '更新快照'
        },
        en: {
            edit: 'Edit',
            delete: 'Delete',
            confirmDelete: 'Are you sure you want to delete this asset?',
            holdings: 'Holdings',
            ticker: 'Ticker',
            company: 'Company',
            market: 'Market',
            type: 'Type',
            quantity: 'Quantity',
            cost: 'Cost',
            currentPrice: 'Price',
            marketValue: 'Value',
            profitLoss: 'P/L',
            profitLossPercent: 'P/L %',
            sector: 'Sector',
            actions: 'Actions',
            stock: 'Stock',
            cash: 'Cash',
            option: 'Option',
            sell: 'Sell',
            buy: 'Buy',
            put: 'Put',
            call: 'Call',
            addAsset: 'Add Asset',
            updateSnapshot: 'Update Snapshot'
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t[lang].confirmDelete)) {
            await api.deleteHolding(id);
            onRefresh();
        }
    };

    return (
        <div className="card">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl" style={{ fontSize: '1.5rem', margin: 0 }}>{t[lang].holdings}</h3>
                {!readOnly && (
                    <div className="flex gap-2">
                        <button onClick={onUpdateSnapshot} className="btn" style={{ fontSize: '0.9rem', marginRight: '0.5rem' }}>{t[lang].updateSnapshot}</button>
                        <button onClick={onAddAsset} className="btn" style={{ fontSize: '0.9rem', background: '#22c55e' }}>{t[lang].addAsset}</button>
                    </div>
                )}
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table>
                    <thead>
                        <tr>
                            <th>{t[lang].ticker}</th>
                            <th>{t[lang].companyName}</th>
                            <th>{t[lang].market}</th>
                            <th>{t[lang].type}</th>
                            <th>{t[lang].quantity}</th>
                            <th>{t[lang].cost}</th>
                            <th>{t[lang].currentPrice}</th>
                            <th>{t[lang].marketValue}</th>
                            <th>{t[lang].profitLoss}</th>
                            <th>{t[lang].profitLossPercent}</th>
                            <th>{t[lang].sector}</th>
                            {!readOnly && <th>{t[lang].actions}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {holdings.map(h => {
                            // Calculate profit/loss using HKD values for accuracy
                            const totalCost = h.cost_value_hkd || 0;
                            const profitLoss = h.market_value_hkd - totalCost;
                            const profitLossPercent = totalCost > 0 ? ((profitLoss / totalCost) * 100) : 0;
                            const profitColor = profitLoss >= 0 ? '#22c55e' : '#ef4444';

                            return (
                                <tr key={h.id}>
                                    <td style={{ fontWeight: 600 }}>{h.ticker || t[lang].cash}</td>
                                    <td>{h.company_name || '-'}</td>
                                    <td>{h.market}</td>
                                    <td>
                                        {h.asset_type === 'Stock' ? t[lang].stock : h.asset_type === 'Cash' ? t[lang].cash : t[lang].option}
                                        {h.asset_type === 'Option' && <span className="text-sm text-gray"> ({h.side === 'Short' ? t[lang].sell : t[lang].buy} {h.option_type === 'Put' ? t[lang].put : t[lang].call} {h.strike_price})</span>}
                                    </td>
                                    <td>{h.quantity}</td>
                                    <td>{h.cost_basis?.toFixed(2)}</td>
                                    <td>{h.current_price?.toFixed(2)}</td>
                                    <td>{h.market_value_hkd?.toFixed(2)}</td>
                                    <td style={{ color: profitColor, fontWeight: 600 }}>
                                        {totalCost > 0 ? (profitLoss >= 0 ? '+' : '') + profitLoss.toFixed(2) : '-'}
                                    </td>
                                    <td style={{ color: profitColor, fontWeight: 600 }}>
                                        {totalCost > 0 ? (profitLoss >= 0 ? '+' : '') + profitLossPercent.toFixed(2) + '%' : '-'}
                                    </td>
                                    <td>{h.sector === 'Cash' ? t[lang].cash : h.sector}</td>
                                    {!readOnly && (
                                        <td>
                                            <button onClick={() => onEdit(h)} className="btn" style={{ padding: '0.35rem 0.65rem', fontSize: '0.9rem', marginRight: '0.5rem' }}>{t[lang].edit}</button>
                                            <button onClick={() => handleDelete(h.id)} className="btn btn-danger" style={{ padding: '0.35rem 0.65rem', fontSize: '0.9rem' }}>{t[lang].delete}</button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
