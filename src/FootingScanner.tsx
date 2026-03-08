import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

// Precise steel data from your reference table
const STEEL_REF: Record<number, { rods: number; bundleWeight: number }> = {
  8:  { rods: 10, bundleWeight: 47.4 },
  10: { rods: 7,  bundleWeight: 51.87 },
  12: { rods: 5,  bundleWeight: 53.35 },
  16: { rods: 3,  bundleWeight: 56.88 },
  20: { rods: 2,  bundleWeight: 59.26 },
  25: { rods: 1,  bundleWeight: 46.3 },
};

const FootingBBSCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const calculateExcelLogic = (sizeFt: number, dia: number, spacing: number, count: number) => {
    // 1. Convert Ft to Meters for spacing calculation
    const sizeM = sizeFt / 3.281;
    
    // 2. No. of bars (Both sides) - Match your Excel ROUNDUP logic
    const noOfBars = Math.ceil(((sizeM * 1000) - 100) / spacing + 1) * 2;

    // 3. Total Cutting Length with 90 deg bends (0.3333 ft each side)
    const totalLengthM = ((sizeFt + 0.6666) * noOfBars) / 3.281;

    // 4. Weight Calculation (D^2 / 162)
    const unitWeight = (dia * dia) / 162;
    const totalKg = totalLengthM * unitWeight * count;

    // 5. Bundle Conversion - Matches your SWITCH logic
    const ref = STEEL_REF[dia];
    const bundles = totalKg / (ref?.bundleWeight || 1);

    return { noOfBars, totalKg, bundles };
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setLoading(true);
    
    const { data: { text } } = await Tesseract.recognize(e.target.files[0], 'eng');
    const tags = ['T1', 'T2', 'T3', 'T4', 'T5'];
    
    const finalReport = tags.map(tag => {
      // Scans image text for occurrences of footing types
      const foundCount = (text.match(new RegExp(tag, 'g')) || []).length;
      if (foundCount === 0) return null;

      // Matching your Excel specs directly
      const specs: any = {
        T1: { s: 4, d: 10, sp: 150 },
        T2: { s: 4.5, d: 10, sp: 120 },
        T3: { s: 5, d: 12, sp: 120 },
        T4: { s: 5.5, d: 12, sp: 100 },
        T5: { s: 6, d: 12, sp: 100 },
      }[tag];

      const calcs = calculateExcelLogic(specs.s, specs.d, specs.sp, foundCount);
      return { tag, count: foundCount, ...specs, ...calcs };
    }).filter(Boolean);

    setResults(finalReport);
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto font-sans text-gray-800">
      <div className="bg-blue-900 text-white p-6 rounded-t-lg shadow-md">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-center">FOOTING BBS Calculator</h1>
      </div>

      <div className="bg-white p-6 border-x border-b shadow-sm rounded-b-lg">
        <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <label className="block text-sm font-bold mb-2 uppercase italic text-gray-600">Upload Drawing (Image/PDF)</label>
          <input type="file" onChange={handleScan} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>

        {loading && <div className="text-center py-10 font-bold text-blue-600 animate-pulse uppercase">Scanning drawing for T1-T5...</div>}

        {results.length > 0 && (
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse border text-sm">
              <thead className="bg-gray-100 uppercase text-xs">
                <tr>
                  <th className="p-3 border">Type</th>
                  <th className="p-3 border">Qty</th>
                  <th className="p-3 border">Bars (Nos)</th>
                  <th className="p-3 border bg-yellow-100 text-red-700 font-bold">Total KG</th>
                  <th className="p-3 border">Bundles</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="text-center border-b hover:bg-blue-50 transition-colors">
                    <td className="p-3 border font-bold uppercase">{r.tag}</td>
                    <td className="p-3 border font-black text-blue-700 text-lg">{r.count}</td>
                    <td className="p-3 border">{r.noOfBars}</td>
                    <td className="p-3 border font-black bg-yellow-50 text-red-600 text-xl italic">{r.totalKg.toFixed(1)}</td>
                    <td className="p-3 border font-bold text-gray-600">{r.bundles.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FootingBBSCalculator;
