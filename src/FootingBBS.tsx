import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STEEL_DATA: Record<number, { rods: number; weight: number }> = {
  8:  { rods: 10, weight: 47.4 },
  10: { rods: 7,  weight: 51.87 },
  12: { rods: 5,  weight: 53.35 },
  16: { rods: 3,  weight: 56.88 },
  20: { rods: 2,  weight: 59.26 },
  25: { rods: 1,  weight: 46.3 },
};

const FootingBBS = () => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([
    { id: Date.now(), tag: 'T1', s: 4, d: 10, sp: 150, qty: 3 }
  ]);

  const calculateRow = (r: any) => {
    const sizeM = r.s / 3.281;
    const bars = Math.ceil(((sizeM * 1000) - 100) / r.sp + 1) * 2;
    const lengthM = ((r.s + 0.6666) * bars) / 3.281;
    const totalKg = (lengthM * ((r.d * r.d) / 162)) * r.qty;
    const bundle = STEEL_DATA[r.d];
    const bundlesNeeded = totalKg / (bundle?.weight || 1);
    return { ...r, bars, lengthM, totalKg, bundlesNeeded };
  };

  const addRow = () => setRows([...rows, { id: Date.now(), tag: `T${rows.length + 1}`, s: 4, d: 10, sp: 150, qty: 1 }]);
  
  const deleteRow = (id: number) => setRows(rows.filter(r => r.id !== id));

  const updateRow = (id: number, field: string, value: any) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: parseFloat(value) || 0 } : r));
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("FOOTING BBS REPORT", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Type', 'Size', 'Dia', 'Spacing', 'Qty', 'Total KG']],
      body: rows.map(r => {
        const c = calculateRow(r);
        return [c.tag, `${c.s}ft`, `${c.d}mm`, `${c.sp}mm`, c.qty, c.totalKg.toFixed(1)];
      }),
    });
    doc.save("Footing_BBS_Report.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <div className="bg-green-600 text-white p-4 sticky top-0 shadow-md z-10 flex justify-between items-center">
        <h1 className="text-lg font-black italic">FOOTING BBS CALCULATOR</h1>
        <button onClick={downloadPDF} className="bg-white text-green-700 px-3 py-1 rounded-md text-xs font-bold shadow">PDF</button>
      </div>

      <div className="p-2">
        {rows.map((row) => {
          const res = calculateRow(row);
          return (
            <div key={row.id} className="bg-white mb-4 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-800 text-white px-3 py-1 flex justify-between items-center">
                <span className="font-bold">{row.tag}</span>
                <button onClick={() => deleteRow(row.id)} className="text-red-400 font-bold text-lg">×</button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 p-3">
                <div className="bg-sky-100 p-2 rounded">
                  <label className="text-[10px] block font-bold text-gray-500 uppercase">Size (Ft)</label>
                  <input type="number" value={row.s} onChange={(e) => updateRow(row.id, 's', e.target.value)} className="w-full bg-transparent font-bold text-blue-800 outline-none" />
                </div>
                <div className="bg-sky-100 p-2 rounded">
                  <label className="text-[10px] block font-bold text-gray-500 uppercase">Dia (mm)</label>
                  <select value={row.d} onChange={(e) => updateRow(row.id, 'd', e.target.value)} className="w-full bg-transparent font-bold text-blue-800 outline-none">
                    {[8, 10, 12, 16, 20, 25].map(d => <option key={d} value={d}>{d}mm</option>)}
                  </select>
                </div>
                <div className="bg-sky-100 p-2 rounded">
                  <label className="text-[10px] block font-bold text-gray-500 uppercase">Spacing (mm)</label>
                  <input type="number" value={row.sp} onChange={(e) => updateRow(row.id, 'sp', e.target.value)} className="w-full bg-transparent font-bold text-blue-800 outline-none" />
                </div>
                <div className="bg-sky-100 p-2 rounded">
                  <label className="text-[10px] block font-bold text-gray-500 uppercase">Qty (Nos)</label>
                  <input type="number" value={row.qty} onChange={(e) => updateRow(row.id, 'qty', e.target.value)} className="w-full bg-transparent font-black text-blue-900 outline-none" />
                </div>
              </div>

              <div className="bg-yellow-400 p-3 flex justify-between items-center border-t border-yellow-500">
                <span className="text-[10px] font-bold uppercase">Balance KG</span>
                <span className="text-xl font-black italic">{res.totalKg.toFixed(1)} KG</span>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={addRow} className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 text-white rounded-full text-3xl shadow-2xl flex items-center justify-center font-bold">+</button>
    </div>
  );
};

export default FootingBBS;
