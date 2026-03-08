import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

// Weight and Rod data from your Excel 'Weight of one bundle' table
const STEEL_DATA: Record<number, { rods: number; weight: number }> = {
  8:  { rods: 10, weight: 47.4 },
  10: { rods: 7,  weight: 51.87 },
  12: { rods: 5,  weight: 53.35 },
  16: { rods: 3,  weight: 56.88 },
  20: { rods: 2,  weight: 59.26 },
  25: { rods: 1,  weight: 46.3 },
};

const FootingBBSCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const calculateBBS = (sizeFt: number, dia: number, spacing: number, count: number) => {
    const sizeM = sizeFt / 3.281;
    // Excel Formula for Bars
    const noOfBars = Math.ceil(((sizeM * 1000) - 100) / spacing + 1) * 2;
    // Excel Formula for Cutting Length with 90 deg bends
    const totalLengthM = ((sizeFt + 0.6666) * noOfBars) / 3.281;
    // Excel Formula for Total KG multiplied by No. of Footings
    const totalKg = (totalLengthM * ((dia * dia) / 162)) * count;
    
    const bundle = STEEL_DATA[dia];
    const bundlesNeeded = totalKg / (bundle?.weight || 1);

    return { noOfBars, totalKg, bundlesNeeded };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setLoading(true);
    const file = e.target.files[0];
    const { data: { text } } = await Tesseract.recognize(file, 'eng');

    const tags = ['T1', 'T2', 'T3', 'T4', 'T5'];
    const finalData = tags.map(tag => {
      // This counts how many times the tag appears in the drawing
      const foundCount = (text.match(new RegExp(tag, 'g')) || []).length;
      if (foundCount === 0) return null;

      // Specifications from your Footing Steel Quantity sheet
      const specs: any = {
        T1: { s: 4, d: 10, sp: 150 },
        T2: { s: 4.5, d: 10, sp: 120 },
        T3: { s: 5, d: 12, sp: 120 },
        T4: { s: 5.5, d: 12, sp: 100 },
        T5: { s: 6, d: 12, sp: 100 },
      }[tag];

      return { tag, count: foundCount, ...specs, ...calculateBBS(specs.s, specs.d, specs.sp, foundCount) };
    }).filter(Boolean);

    setResults(finalData || []);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen font-sans">
      <div className="bg-blue-900 text-white p-8 rounded-t-2xl shadow-lg">
        <h1 className="text-3xl font-black italic tracking-tight text-center uppercase">FOOTING BBS Calculator</h1>
      </div>

      <div className="bg-white p-8 border-x border-b rounded-b-2xl shadow-md">
        <div className="mb-8 p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-center">
          <input type="file" onChange={handleFileUpload} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-800 cursor-pointer" />
          <p className="mt-3 text-xs text-gray-500 font-bold uppercase italic">Upload Drawing to scan Qty and calculate Total Balance KG</p>
        </div>

        {loading && <div className="text-center py-10 text-blue-600 font-black animate-pulse text-xl uppercase">Scanning Footing Qty...</div>}

        {results.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-800 text-white text-xs uppercase text-center">
                  <th className="p-4 border">Type</th>
                  <th className="p-4 border">Qty (Nos)</th>
                  <th className="p-4 border">Bars/Footing</th>
                  <th className="p-4 border bg-yellow-600">Total KG (Balance)</th>
                  <th className="p-4 border">Bundles</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="hover:bg-blue-50 text-center border-b">
                    <td className="p-4 font-black border uppercase">{r.tag}</td>
                    <td className="p-4 font-bold text-blue-700 border text-lg">{r.count}</td>
                    <td className="p-4 border">{r.noOfBars}</td>
                    <td className="p-4 font-black text-red-600 bg-yellow-50 border text-2xl tracking-tighter italic">{r.totalKg.toFixed(1)}</td>
                    <td className="p-4 border font-bold text-gray-600">{r.bundlesNeeded.toFixed(3)}</td>
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
