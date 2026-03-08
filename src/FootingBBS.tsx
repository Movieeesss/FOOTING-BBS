import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Steel Bundle data logic from Excel Reference
const STEEL_REF: Record<number, { rods: number; bundleWeight: number }> = {
  8:  { rods: 10, bundleWeight: 47.4 },
  10: { rods: 7,  bundleWeight: 51.87 },
  12: { rods: 5,  bundleWeight: 53.35 },
  16: { rods: 3,  bundleWeight: 56.88 },
  20: { rods: 2,  bundleWeight: 59.26 },
  25: { rods: 1,  bundleWeight: 46.3 },
};

export default function FootingBBSCalculator() {
  const [rows, setRows] = useState<any[]>([
    { id: 1, tag: 'T1', s: 4, d: 10, sp: 150, qty: 3 }
  ]);

  const calculateBBS = (r: any) => {
    // Formulas derived from Excel screenshots
    const sizeM = r.s / 3.281;
    // ROUNDUP logic for bars on both sides
    const bars = Math.ceil(((sizeM * 1000) - 100) / r.sp + 1) * 2;
    // Total cutting length including 90 degree bends (0.6666 ft)
    const lengthM = ((r.s + 0.6666) * bars) / 3.281;
    // Final KG weight logic (D^2 / 162)
    const totalKg = (lengthM * ((r.d * r.d) / 162)) * r.qty;
    return { bars, totalKg };
  };

  // --- NEW FEATURE: DIAMETER-WISE SUMMARY LOGIC ---
  const getSummary = () => {
    const summary: Record<number, number> = { 8: 0, 10: 0, 12: 0, 16: 0, 20: 0, 25: 0 };
    rows.forEach(row => {
      const { totalKg } = calculateBBS(row);
      summary[row.d] += totalKg;
    });
    return summary;
  };

  const addRow = () => setRows([...rows, { id: Date.now(), tag: `T${rows.length + 1}`, s: 4, d: 10, sp: 150, qty: 1 }]);
  const deleteRow = (id: number) => setRows(rows.filter(row => row.id !== id));
  
  const updateRow = (id: number, field: string, val: any) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: val } : row));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("FOOTING BBS CALCULATION REPORT", 14, 15);

    // Main Table
    autoTable(doc, {
      startY: 20,
      head: [['Type', 'Size (Ft)', 'Dia (mm)', 'Spacing', 'Qty', 'Total KG']],
      body: rows.map(r => {
        const res = calculateBBS(r);
        return [r.tag, `${r.s}x${r.s}`, `${r.d}mm`, r.sp, r.qty, res.totalKg.toFixed(2)];
      }),
      headStyles: { fillColor: [146, 208, 80] } // Match header green
    });

    // Summary Table in PDF
    const summaryData = getSummary();
    const summaryRows = Object.entries(summaryData)
      .filter(([_, kg]) => kg > 0)
      .map(([dia, kg]) => [`${dia}mm Steel`, `${kg.toFixed(2)} KG`]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Diameter Summary', 'Total Weight']],
      body: summaryRows,
      headStyles: { fillColor: [0, 112, 192] }, // Summary blue
    });

    doc.save("Footing_BBS_Summary_Report.pdf");
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#fff', minHeight: '100vh', border: '1px solid #ddd' }}>
      <header style={{ backgroundColor: '#92d050', padding: '15px', textAlign: 'center', fontWeight: '900', fontSize: '18px', borderBottom: '2px solid #76b041', textTransform: 'uppercase' }}>
        Footing BBS Calculator
      </header>

      <div style={{ padding: '12px' }}>
        {rows.map((row) => {
          const res = calculateBBS(row);
          return (
            <div key={row.id} style={{ marginBottom: '20px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #ccc', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ backgroundColor: '#00b0f0', border: '3px solid #0070c0' }}>
                <div style={{ backgroundColor: '#0070c0', color: 'white', padding: '5px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', display: 'flex', justifyContent: 'space-between', paddingLeft: '10px', paddingRight: '5px' }}>
                  <span>EDITABLE DATA - {row.tag}</span>
                  <button onClick={() => deleteRow(row.id)} style={{ background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.2)', padding: '5px 10px', borderRadius: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Size (Ft)</label>
                    <input type="number" value={row.s} onChange={e => updateRow(row.id, 's', parseFloat(e.target.value))} style={{ width: '80px', textAlign: 'right', padding: '4px', border: '1px solid #0070c0', borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.2)', padding: '5px 10px', borderRadius: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Dia (mm)</label>
                    <select value={row.d} onChange={e => updateRow(row.id, 'd', parseInt(e.target.value))} style={{ width: '90px', padding: '4px', border: '1px solid #0070c0', borderRadius: '4px' }}>
                      {[8, 10, 12, 16, 20, 25].map(d => <option key={d} value={d}>{d}mm</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.2)', padding: '5px 10px', borderRadius: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Spacing (mm)</label>
                    <input type="number" value={row.sp} onChange={e => updateRow(row.id, 'sp', parseInt(e.target.value))} style={{ width: '80px', textAlign: 'right', padding: '4px', border: '1px solid #0070c0', borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.2)', padding: '5px 10px', borderRadius: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Qty (Nos)</label>
                    <input type="number" value={row.qty} onChange={e => updateRow(row.id, 'qty', parseInt(e.target.value))} style={{ width: '80px', textAlign: 'right', padding: '4px', border: '1px solid #0070c0', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#ffff00', fontSize: '13px', fontWeight: 'bold' }}>
                <span>No. of Bars (Both sides)</span>
                <span>{res.bars} Nos</span>
              </div>
              <div style={{ backgroundColor: '#92d050', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #76b041' }}>
                <span style={{ fontWeight: '900', fontSize: '14px', fontStyle: 'italic' }}>BALANCE STEEL</span>
                <span style={{ fontWeight: '900', fontSize: '18px', color: '#003366' }}>{res.totalKg.toFixed(2)} KG</span>
              </div>
            </div>
          );
        })}

        {/* --- NEW SUMMARY UI SECTION --- */}
        <div style={{ backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '10px', border: '2px solid #ccc', marginBottom: '15px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '2px solid #333', marginBottom: '8px', textAlign: 'center' }}>PROJECT TOTAL SUMMARY</div>
          {Object.entries(getSummary()).map(([dia, kg]) => kg > 0 && (
            <div key={dia} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #999' }}>
              <span style={{ fontWeight: 'bold', color: '#0070c0' }}>{dia}mm Rods:</span>
              <span style={{ fontWeight: 'bold' }}>{kg.toFixed(2)} KG</span>
            </div>
          ))}
        </div>

        <button onClick={addRow} style={{ width: '100%', padding: '12px', backgroundColor: '#0070c0', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginBottom: '10px', cursor: 'pointer' }}>
          + ADD NEW FOOTING ROW
        </button>

        <button onClick={generatePDF} style={{ width: '100%', padding: '15px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
          PRINT TO PDF / SAVE REPORT
        </button>
      </div>
    </div>
  );
}
