import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

// Bundle data from your 'Weight of one bundle' table
const STEEL_DATA: Record<number, { rods: number; weight: number }> = {
  8:  { rods: 10, weight: 47.4 },
  10: { rods: 7,  weight: 51.87 },
  12: { rods: 5,  weight: 53.35 },
  16: { rods: 3,  weight: 56.88 },
  20: { rods: 2,  weight: 59.26 },
  25: { rods: 1,  weight: 46.3 },
};

const FootingScanner = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const calculateBBS = (sizeFt: number, dia: number, spacing: number, count: number) => {
    const sizeM = sizeFt / 3.281;
    // Your Formula: ROUNDUP((((Size/3.281)*1000)-100)/(Spacing)+1,0)*2
    const noOfBars = Math.ceil(((sizeM * 1000) - 100) / spacing + 1) * 2;
    // Your Formula: (Size + 0.3333 + 0.3333) * NoBars / 3.281
    const totalLengthM = ((sizeFt + 0.6666) * noOfBars) / 3.281;
    const totalKg = (totalLengthM * ((dia * dia) / 162)) * count;
    
    const bundle = STEEL_DATA[dia];
    const bundlesNeeded = totalKg / (bundle?.weight || 1);

    return { noOfBars, totalKg, bundlesNeeded };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setLoading(true);
    const { data: { text } } = await Tesseract.recognize(e.target.files[0], 'eng');

    const tags = ['T1', 'T2', 'T3', 'T4', 'T5'];
    const finalData = tags.map(tag => {
      const foundCount = (text.match(new RegExp(tag, 'g')) || []).length;
      if (foundCount === 0) return null;

      const specs: any = {
        T1: { s: 4, d: 10, sp: 150 },
        T2: { s: 4.5, d: 10, sp: 120 },
        T3: { s: 5, d: 12, sp: 120 },
        T4: { s: 5.5, d: 12, sp: 120 },
        T5: { s: 6, d: 12, sp: 120 },
      }[tag];

      return { tag, count: foundCount, ...specs, ...calculateBBS(specs.s, specs.d, specs.sp, foundCount) };
    }).filter(Boolean);

    setResults(finalData);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <div className="bg-green-700 text-white p-8 rounded-t-2xl shadow-lg">
        <h1 className="text-3xl font-black italic">UNIQ DESIGNS - BBS AUTOMATOR</h1>
      </div>
      <div className="bg-white p-8 border shadow-md rounded-b-2xl">
        <input type="file" onChange={handleFileUpload} className="block w-full text-sm mb-6 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-green-600 file:text-white" />
        {loading && <p className="text-center font-bold animate-pulse">Scanning Drawing...</p>}
        {results.length > 0 && (
          <table className="w-full border-collapse mt-4">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-3 border">Type</th>
                <th className="p-3 border">Nos</th>
                <th className="p-3 border">Bars/Ft</th>
                <th className="p-3 border bg-yellow-600">Total KG</th>
                <th className="p-3 border">Bundles</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="text-center border-b">
                  <td className="p-3 font-bold">{r.tag}</td>
                  <td className="p-3">{r.count}</td>
                  <td className="p-3">{r.noOfBars}</td>
                  <td className="p-3 font-black text-red-600">{r.totalKg.toFixed(1)}</td>
                  <td className="p-3">{r.bundlesNeeded.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FootingScanner;
