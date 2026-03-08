import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

// Weight and Rod data from your Excel
const STEEL_REF: Record<number, { rods: number; bundleWeight: number }> = {
  8:  { rods: 10, bundleWeight: 47.4 },
  10: { rods: 7,  bundleWeight: 51.87 },
  12: { rods: 5,  bundleWeight: 53.35 },
  16: { rods: 3,  bundleWeight: 56.88 },
  20: { rods: 2,  bundleWeight: 59.26 },
  25: { rods: 1,  bundleWeight: 46.3 },
};

interface FootingSpecs {
  size: number;
  dia: number;
  spacing: number;
}

const FootingScanner = () => {
  const [loading, setLoading] = useState(false);
  const [library, setLibrary] = useState<Record<string, FootingSpecs>>({});
  const [finalReport, setFinalReport] = useState<any[]>([]);

  // Your exact Excel Calculation Logic
  const runBBS = (type: string, specs: FootingSpecs, count: number) => {
    const sizeM = specs.size / 3.281;
    
    // Formula: ROUNDUP((((Size_M)*1000)-100)/(Spacing)+1,0)*2
    const noOfBars = Math.ceil(((sizeM * 1000) - 100) / specs.spacing + 1) * 2;

    // Formula: (Size_Ft + 0.6666) * NoBars / 3.281 (Total Cutting Length in M)
    const totalLengthM = ((specs.size + 0.6666) * noOfBars) / 3.281;

    const unitWeight = (specs.dia * specs.dia) / 162;
    const totalKg = totalLengthM * unitWeight * count; //

    const ref = STEEL_REF[specs.dia];
    const bundles = totalKg / (ref?.bundleWeight || 1); //

    return { noOfBars, totalKg, bundles };
  };

  // STEP 1: Scan Footing Detail Image to store specs
  const scanDetailTable = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setLoading(true);
    const { data: { text } } = await Tesseract.recognize(e.target.files[0], 'eng');
    
    // Simple logic to find T1, T2 etc. in the text and assign defaults if found
    const newLibrary: Record<string, FootingSpecs> = {};
    const tags = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    tags.forEach(tag => {
      if (text.includes(tag)) {
        // Here you can add logic to regex the size, or keep your manual defaults
        if (tag === 'T1') newLibrary[tag] = { size: 4, dia: 10, spacing: 150 };
        if (tag === 'T2') newLibrary[tag] = { size: 4.5, dia: 10, spacing: 120 };
        if (tag === 'T3') newLibrary[tag] = { size: 5, dia: 12, spacing: 120 };
        if (tag === 'T4') newLibrary[tag] = { size: 5.5, dia: 12, spacing: 120 };
        if (tag === 'T5') newLibrary[tag] = { size: 6, dia: 12, spacing: 120 };
      }
    });
    setLibrary(newLibrary);
    setLoading(false);
    alert("Detail Table Scanned! Now upload the Layout.");
  };

  // STEP 2: Scan Layout to count tags
  const scanLayout = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setLoading(true);
    const { data: { text } } = await Tesseract.recognize(e.target.files[0], 'eng');

    const report = Object.keys(library).map(tag => {
      const count = (text.match(new RegExp(tag, 'g')) || []).length;
      if (count === 0) return null;

      const calc = runBBS(tag, library[tag], count);
      return { tag, count, ...library[tag], ...calc };
    }).filter(Boolean);

    setFinalReport(report);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gray-50 font-sans">
      <header className="bg-green-700 text-white p-6 rounded-t-xl mb-4">
        <h1 className="text-2xl font-black italic">UNIQ DESIGNS - BBS AUTOMATOR</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-white shadow rounded-lg border-l-4 border-blue-500">
          <label className="block font-bold text-gray-700 mb-2">1. Upload Footing Detail (Table)</label>
          <input type="file" onChange={scanDetailTable} className="w-full text-sm" />
        </div>
        <div className="p-4 bg-white shadow rounded-lg border-l-4 border-green-500">
          <label className="block font-bold text-gray-700 mb-2">2. Upload Footing Layout (Drawing)</label>
          <input type="file" onChange={scanLayout} disabled={Object.keys(library).length === 0} className="w-full text-sm disabled:opacity-50" />
        </div>
      </div>

      {loading && <div className="p-10 text-center font-bold text-green-600 animate-bounce text-xl">PROCESSSING DRAWING...</div>}

      {finalReport.length > 0 && (
        <div className="bg-white shadow-xl rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-4 border">TYPE</th>
                <th className="p-4 border">NOS</th>
                <th className="p-4 border">DIA</th>
                <th className="p-4 border">BARS/FOOTING</th>
                <th className="p-4 border bg-yellow-600">TOTAL KG</th>
                <th className="p-4 border">BUNDLES</th>
              </tr>
            </thead>
            <tbody>
              {finalReport.map((item, i) => (
                <tr key={i} className="border-b hover:bg-green-50">
                  <td className="p-4 font-bold border">{item.tag}</td>
                  <td className="p-4 text-blue-600 font-bold border">{item.count}</td>
                  <td className="p-4 border">{item.dia}mm</td>
                  <td className="p-4 border">{item.noOfBars}</td>
                  <td className="p-4 bg-yellow-100 font-black text-red-700 border text-lg">{item.totalKg.toFixed(2)}</td>
                  <td className="p-4 border font-bold">{item.bundles.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FootingScanner;
