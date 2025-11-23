import React, { useState } from 'react';
import { api } from '../services/api';

export default function AssetForm({ onSave, onClose, initialData, lang = 'en' }) {
    const t = {
        zh: {
            editAsset: '编辑资产',
            addAsset: '添加资产',
            market: '市场',
            type: '类型',
            ticker: '代码',
            quantity: '数量',
            costBasis: '成本 (每股)',
            companyName: '公司名',
            sector: '行业',
            optionType: '期权类型',
            side: '方向',
            strikePrice: '行权价',
            expiryDate: '到期日',
            cancel: '取消',
            save: '保存',
            stock: '股票',
            option: '期权',
            cash: '现金',
            put: '看跌',
            call: '看涨',
            sell: '卖出 (Short)',
            buy: '买入 (Long)'
        },
        en: {
            editAsset: 'Edit Asset',
            addAsset: 'Add Asset',
            market: 'Market',
            type: 'Type',
            ticker: 'Ticker',
            quantity: 'Quantity',
            costBasis: 'Cost Basis (Per Share)',
            companyName: 'Company Name',
            sector: 'Sector',
            optionType: 'Option Type',
            side: 'Side',
            strikePrice: 'Strike Price',
            expiryDate: 'Expiry Date',
            cancel: 'Cancel',
            save: 'Save',
            stock: 'Stock',
            option: 'Option',
            cash: 'Cash',
            put: 'Put',
            call: 'Call',
            sell: 'Sell (Short)',
            buy: 'Buy (Long)'
        }
    };

    const [formData, setFormData] = useState(initialData || {
        ticker: '',
        market: 'US',
        asset_type: 'Stock',
        quantity: 0,
        cost_basis: 0,
        company_name: '',
        custom_sector: '',
        option_type: 'Put',
        strike_price: 0,
        expiry_date: '',
        side: 'Short' // Default to Short for Sell Put
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'quantity' || name === 'cost_basis' || name === 'strike_price'
                ? parseFloat(value)
                : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Adjust quantity for Short position if needed (user inputs positive, we store negative?)
        // Or we trust user input. Let's trust user input but maybe hint.
        // User requirement: "Sell Put". Usually implies negative quantity.
        // Let's handle it: if side is Short, ensure quantity is negative.
        let payload = { ...formData };
        if (payload.asset_type === 'Option' && payload.side === 'Short' && payload.quantity > 0) {
            payload.quantity = -payload.quantity;
        }

        // Clean payload: remove empty strings for optional fields or set to null
        if (payload.asset_type !== 'Option') {
            payload.option_type = null;
            payload.strike_price = null;
            payload.expiry_date = null;
            payload.side = null;
        } else {
            // For options, ensure fields are valid
            if (!payload.expiry_date) payload.expiry_date = null;
        }

        // Remove id from payload if it's empty/null to avoid backend confusion (though backend ignores it for add)
        if (!payload.id) delete payload.id;

        if (initialData && initialData.id) {
            await api.updateHolding(initialData.id, payload);
        } else {
            await api.addHolding(payload);
        }
        onSave();
    };

    return (
        <div className="card">
            <h3 className="text-xl mb-4">{initialData ? t[lang].editAsset : t[lang].addAsset}</h3>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2">
                    <div>
                        <label className="text-sm text-gray">{t[lang].market}</label>
                        <select name="market" value={formData.market} onChange={handleChange}>
                            <option value="US">US</option>
                            <option value="HK">HK</option>
                            <option value="CN">CN</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray">{t[lang].type}</label>
                        <select name="asset_type" value={formData.asset_type} onChange={handleChange}>
                            <option value="Stock">{t[lang].stock}</option>
                            <option value="Option">{t[lang].option}</option>
                            <option value="Cash">{t[lang].cash}</option>
                        </select>
                    </div>
                </div>

                {formData.asset_type !== 'Cash' && (
                    <div>
                        <label className="text-sm text-gray">{t[lang].ticker}</label>
                        <input name="ticker" value={formData.ticker} onChange={handleChange} placeholder="AAPL, 0700, 600519" required />
                    </div>
                )}

                <div className="grid grid-cols-2">
                    <div>
                        <label className="text-sm text-gray">{t[lang].quantity}</label>
                        <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} step="any" required />
                    </div>
                    <div>
                        <label className="text-sm text-gray">{t[lang].costBasis}</label>
                        <input type="number" name="cost_basis" value={formData.cost_basis} onChange={handleChange} step="any" />
                    </div>
                </div>

                {formData.asset_type !== 'Cash' && (
                    <>
                        <div>
                            <label className="text-sm text-gray">{t[lang].companyName}</label>
                            <input name="company_name" value={formData.company_name} onChange={handleChange} placeholder="Apple Inc." />
                        </div>
                        <div>
                            <label className="text-sm text-gray">{t[lang].sector}</label>
                            <select name="custom_sector" value={formData.custom_sector} onChange={handleChange}>
                                <option value="">--</option>
                                <option value="信息 & 科技 / IT">信息 & 科技 / IT</option>
                                <option value="通信 / Comm.">通信 / Comm.</option>
                                <option value="金融 / Financial">金融 / Financial</option>
                                <option value="必选消费 / Con. Staples">必选消费 / Con. Staples</option>
                                <option value="非必选消费 / Con. Disc.">非必选消费 / Con. Disc.</option>
                                <option value="医疗 / Healthcare">医疗 / Healthcare</option>
                                <option value="工业 / Industrial">工业 / Industrial</option>
                                <option value="能源 / Energy">能源 / Energy</option>
                                <option value="材料 / Materials">材料 / Materials</option>
                                <option value="房地产 / Real Estate">房地产 / Real Estate</option>
                                <option value="公用事业 / Utilities">公用事业 / Utilities</option>
                            </select>
                        </div>
                    </>
                )}

                {formData.asset_type === 'Option' && (
                    <>
                        <div className="grid grid-cols-2">
                            <div>
                                <label className="text-sm text-gray">{t[lang].optionType}</label>
                                <select name="option_type" value={formData.option_type} onChange={handleChange}>
                                    <option value="Put">{t[lang].put}</option>
                                    <option value="Call">{t[lang].call}</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray">{t[lang].side}</label>
                                <select name="side" value={formData.side} onChange={handleChange}>
                                    <option value="Short">{t[lang].sell}</option>
                                    <option value="Long">{t[lang].buy}</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2">
                            <div>
                                <label className="text-sm text-gray">{t[lang].strikePrice}</label>
                                <input type="number" name="strike_price" value={formData.strike_price} onChange={handleChange} step="any" required />
                            </div>
                            <div>
                                <label className="text-sm text-gray">{t[lang].expiryDate}</label>
                                <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} required />
                            </div>
                        </div>
                    </>
                )}

                <div className="flex justify-between mt-4">
                    <button type="button" onClick={onClose} className="btn" style={{ background: 'transparent', border: '1px solid #334155' }}>{t[lang].cancel}</button>
                    <button type="submit" className="btn">{t[lang].save}</button>
                </div>
            </form>
        </div>
    );
}
