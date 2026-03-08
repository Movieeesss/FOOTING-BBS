import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

// Exact steel data from your reference table (Image_a9818a)
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
    // 1. Convert Ft to Meters for spacing calc
    const sizeM = sizeFt / 3.281;
    
    // 2. No. of bars (Both sides) - Excel: ROUNDUP((((B5/3.281)*1000)-100)/(E5)+1,0)*2
    const noOfBars = Math.ceil(((sizeM * 1000) - 100) / spacing + 1) * 2;

    // 3. Total Cutting Length with 90 bend - Excel: (B5+0.3333+0.3333)*F5/3.281
    const totalLengthM = ((sizeFt + 0.6666) * noOfBars) / 3.281;

    // 4. Weight Calculation (D^2 / 162)
    const unitWeight = (dia * dia) / 162;
    const totalKg = totalLengthM * unitWeight * count;

    // 5. Bundle Conversion - Excel: SWITCH logic for bundle weights
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
      // Scans image text for occurrences of T1, T2, etc.
      const foundCount = (text.match(new RegExp(tag, 'g')) || []).length;
      if (foundCount === 0) return null;

      // Matching your Excel specs (Image_a990e6)
      const specs: any = {
        T1: { s: 4, d: 10, sp: 150 },
        T2: { s: 4.5, d: 10, sp: 120 },
        T3: { s: 5, d: 12, sp: 120 },
        T4: { s: 5.5, d: 12, sp: 120 },
        T5: { s: 6, d: 12, sp: 120 },
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
          <label className="block text-sm font-bold mb-2">Upload Footing Layout or Details (Image/PDF)</label>
          <input type="file" onChange={handleScan} className="block w-full text-sm" />
        </div>

        {loading && <div className="text-center py-10 font-bold text-blue-600 animate-pulse">Calculating matching Excel values...</div>}

        {results.length > 0 && (
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse border text-sm">
              <thead className="bg-gray-100 uppercase text-xs">
                <tr>
                  <th className="p-3 border">Footing Type</th>
                  <th className="p-3 border text-blue-700">Nos Found</th>
                  <th className="p-3 border">Bars (Nos)</th>
                  <th className="p-3 border bg-yellow-100 text-red-700 font-bold">Total KG</th>
                  <th className="p-3 border">Required Bundles</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="text-center border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3 border font-bold">{r.tag}</td>
                    <td className="p-3 border font-black text-blue-600 text-lg">{r.count}</td>
                    <td className="p-3 border">{r.noOfBars}</td>
                    <td className="p-3 border font-black bg-yellow-50 text-red-600 text-xl">{r.totalKg.toFixed(1)}</td>
                    <td className="p-3 border font-bold">{r.bundles.toFixed(3)}</td>
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
