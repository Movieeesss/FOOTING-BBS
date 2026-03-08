import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

// Your Excel Steel Data: Weight and Rods per bundle
const BUNDLE_DATA: Record<number, { rods: number; weight: number }> = {
  8:  { rods: 10, weight: 47.4 },
  10: { rods: 7,  weight: 51.87 },
  12: { rods: 5,  weight: 53.35 },
  16: { rods: 3,  weight: 56.88 },
  20: { rods: 2,  weight: 59.26 },
  25: { rods: 1,  weight: 46.3 },
};

const FootingBBS = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  // Your Excel Logic: =ROUNDUP((((Size/3.281)*1000)-100)/(Spacing)+1,0)*2
  const calculateSteel = (sizeFt: number, dia: number, spacing: number, count: number) => {
    const sizeM = sizeFt / 3.281;
    const noOfBars = Math.ceil(((sizeM * 1000) - 100) / spacing + 1) * 2;
    const cutLength = ((sizeFt + 0.6666) * noOfBars) / 3.281;
    const totalKg = (cutLength * ((dia * dia) / 162)) * count;
    
    const bundle = BUNDLE_DATA[dia];
    const reqBundles = totalKg / (bundle?.weight || 1);

    return { noOfBars, totalKg, reqBundles };
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setLoading(true);
    const { data: { text } } = await Tesseract.recognize(e.target.files[0], 'eng');

    // Searching drawing for Footing Types
    const tags = ['T1', 'T2', 'T3', 'T4', 'T5'];
    const results = tags.map(tag => {
      const occurrences = (text.match(new RegExp(tag, 'g')) || []).length;
      if (occurrences === 0) return null;

      // Map sizes from your detail sheet
      const specs: any = {
        T1: { size: 4, d: 10, s: 150 },
        T2: { size: 4.5, d: 10, s: 120 },
        T3: { size: 5, d: 12, s: 120 },
        T4: { size: 5.5, d: 12, s: 120 },
        T5: { size: 6, d: 12, s: 120 },
      }[tag];

      return { tag, count: occurrences, ...specs, ...calculateSteel(specs.size, specs.d, specs.s, occurrences) };
    }).filter(Boolean);

    setData(results);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      <div className="bg-green-600 text-white p-6 rounded-t-xl shadow-lg">
        <h1 className="text-2xl font-bold italic">UNIQ DESIGNS - FOOTING BBS SCANNER</h1>
      </div>

      <div className="bg-white p-8 border-x border-b shadow-sm rounded-b-xl">
        <label className="block mb-4 font-bold text-gray-700">Upload Footing Layout Drawing</label>
        <input type="file" onChange={handleScan} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
        
        {loading && <p className="mt-4 text-blue-600 font-bold animate-pulse">Scanning drawing... Please wait...</p>}

        {data.length > 0 && (
          <table className="w-full mt-8 border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left text-xs uppercase text-gray-600">
                <th className="p-3 border">Type</th>
                <th className="p-3 border">Nos Found</th>
                <th className="p-3 border">Bars/Ft</th>
                <th className="p-3 border bg-yellow-100">Total KG</th>
                <th className="p-3 border">Bundles</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={i} className="border-b">
                  <td className="p-3 font-bold">{item.tag}</td>
                  <td className="p-3 text-blue-600 font-bold">{item.count}</td>
                  <td className="p-3">{item.noOfBars}</td>
                  <td className="p-3 font-black text-red-600">{item.totalKg.toFixed(2)}</td>
                  <td className="p-3">{item.reqBundles.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FootingBBS;
