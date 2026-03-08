import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Steel Bundle Data from your Excel reference
const STEEL_REF: Record<number, { rods: number; weight: number }> = {
  8:  { rods: 10, weight: 47.4 },
  10: { rods: 7,  weight: 51.87 },
  12: { rods: 5,  weight: 53.35 },
  16: { rods: 3,  weight: 56.88 },
  20: { rods: 2,  weight: 59.26 },
  25: { rods: 1,  weight: 46.3 },
};

const FootingBBS = () => {
  const [rows, setRows] = useState<any[]>([
    { id: 1, tag: 'T1', s: 4, d: 10, sp: 150, qty: 3 }
  ]);

  // Logic from your Excel Formulas
  const calculateResult = (r: any) => {
    const sizeM = r.s / 3.281;
    // Formula from your sheet: =ROUNDUP((((Size/3.281)*1000)-100)/(Spacing)+1,0)*2
    const bars = Math.ceil(((sizeM * 1000) - 100) / r.sp + 1) * 2;
    // Formula from your sheet: =(Size+0.3333+0.3333)*Bars/3.281
    const lengthM = ((r.s + 0.6666) * bars) / 3.281;
    // Formula: =(Length * (Dia^2 / 162)) * Qty
    const totalKg = (lengthM * ((r.d * r.d) / 162)) * r.qty;
    
    return { bars, totalKg };
  };

  const addRow = () => setRows([...rows, { id: Date.now(), tag: `T${rows.length + 1}`, s: 4, d: 10, sp: 150, qty: 1 }]);
  const deleteRow = (id: number) => setRows(rows.filter(r => r.id !== id));
  const updateRow = (id: number, field: string, val: any) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("FOOTING BBS CALCULATION REPORT", 14, 20);
    const tableData = rows.map(r => {
      const res = calculateResult(r);
      return [r.tag, `${r.s}x${r.s}`, `${r.d}mm`, r.sp, r.qty, res.totalKg.toFixed(2)];
    });
    autoTable(doc, {
      startY: 30,
      head: [['Type', 'Size (Ft)', 'Dia', 'Spacing', 'Qty', 'Total KG']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74] } // Green matching your header
    });
    doc.save("Footing_BBS_Report.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-10">
      {/* Header matching Doubly Reinforced pattern */}
      <div className="bg-[#8cc63f] p-4 text-center shadow-md mb-4 sticky top-0 z-50">
        <h1 className="text-xl font-black uppercase tracking-widest text-white">Footing BBS Calculator</h1>
      </div>

      <div className="max-w-md mx-auto px-4">
        {rows.map((row) => {
          const res = calculateResult(row);
          return (
            <div key={row.id} className="mb-6 shadow-xl rounded-xl overflow-hidden border border-gray-200 bg-white animate-in slide-in-from-bottom-4">
              {/* Editable Section Header (Blue) */}
              <div className="bg-[#0088cc] p-3 flex justify-between items-center">
                <span className="text-white font-bold uppercase tracking-tighter italic">Editable Data - {row.tag}</span>
                <button 
                  onClick={() => deleteRow(row.id)} 
                  className="bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold shadow-inner"
                >×</button>
              </div>

              {/* Input Fields (Light Blue Background) */}
              <div className="p-4 space-y-3 bg-[#e0f2ff]">
                <div className="flex justify-between items-center bg-white rounded-lg border border-[#00aaff] p-2 shadow-sm">
                  <label className="text-blue-800 font-bold text-sm">Footing Size (Ft)</label>
                  <input 
                    type="number" 
                    value={row.s} 
                    onChange={(e) => updateRow(row.id, 's', parseFloat(e.target.value))} 
                    className="w-20 text-right font-black text-lg outline-none text-gray-800" 
                  />
                </div>
                <div className="flex justify-between items-center bg-white rounded-lg border border-[#00aaff] p-2 shadow-sm">
                  <label className="text-blue-800 font-bold text-sm">Dia of Bars (mm)</label>
                  <select 
                    value={row.d} 
                    onChange={(e) => updateRow(row.id, 'd', parseInt(e.target.value))} 
                    className="font-black text-lg outline-none bg-transparent text-gray-800"
                  >
                    {[8, 10, 12, 16, 20, 25].map(d => <option key={d} value={d}>{d}mm</option>)}
                  </select>
                </div>
                <div className="flex justify-between items-center bg-white rounded-lg border border-[#00aaff] p-2 shadow-sm">
                  <label className="text-blue-800 font-bold text-sm">Spacing (mm)</label>
                  <input 
                    type="number" 
                    value={row.sp} 
                    onChange={(e) => updateRow(row.id, 'sp', parseInt(e.target.value))} 
                    className="w-20 text-right font-black text-lg outline-none text-gray-800" 
                  />
                </div>
                <div className="flex justify-between items-center bg-white rounded-lg border border-[#00aaff] p-2 shadow-sm">
                  <label className="text-blue-800 font-bold text-sm">Qty (Nos)</label>
                  <input 
                    type="number" 
                    value={row.qty} 
                    onChange={(e) => updateRow(row.id, 'qty', parseInt(e.target.value))} 
                    className="w-20 text-right font-black text-lg outline-none text-gray-800" 
                  />
                </div>
              </div>

              {/* Results Section (Yellow Background) */}
              <div className="bg-[#ffff00] p-4 space-y-2 border-t-2 border-yellow-400">
                <div className="flex justify-between font-bold text-gray-800 border-b border-yellow-300 pb-1">
                  <span>No. of Bars (Both sides)</span>
                  <span className="text-blue-800">{res.bars} Nos</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-black uppercase text-gray-700 italic">Balance Steel</span>
                  <span className="text-2xl font-black text-blue-900 tracking-tighter">{res.totalKg.toFixed(2)} KG</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-4">
          <button 
            onClick={addRow} 
            className="w-full bg-blue-600 text-white font-black p-4 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest"
          >+ Add New Footing Row</button>
          
          <button 
            onClick={generatePDF} 
            className="w-full bg-[#333333] text-white font-black p-4 rounded-xl shadow-lg hover:bg-black active:scale-95 transition-all uppercase tracking-widest"
          >Print to PDF / Save Report</button>
        </div>
      </div>
    </div>
  );
};

export default FootingBBS;
