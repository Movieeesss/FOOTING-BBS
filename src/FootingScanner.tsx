import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

// Your Excel Steel Data Table
const STEEL_TABLE: Record<number, { rods: number; bundleWeight: number }> = {
  8:  { rods: 10, bundleWeight: 47.4 },
  10: { rods: 7,  bundleWeight: 51.87 },
  12: { rods: 5,  bundleWeight: 53.35 },
  16: { rods: 3,  bundleWeight: 56.88 },
  20: { rods: 2,  bundleWeight: 59.26 },
  25: { rods: 1,  bundleWeight: 46.3 },
};

const FootingScanner = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // The Brain: Your Excel Formulas Integrated
  const calculateSteel = (type: string, sizeFt: number, dia: number, spacing: number, count: number) => {
    const sizeM = sizeFt / 3.281; 
    
    // 1. No. of Bars (Both Sides)
    // Formula: ROUNDUP((((Size/3.281)*1000)-100)/(Spacing)+1,0)*2
    const noOfBars = Math.ceil(((sizeM * 1000) - 100) / spacing + 1) * 2;

    // 2. Total Cutting Length with 90 deg bend (in Meters)
    // Formula: (Size + 0.6666) * NoOfBars / 3.281
    const totalLengthM = ((sizeFt + 0.6666) * noOfBars) / 3.281;

    // 3. Unit Weight (D^2 / 162)
    const unitWeight = (dia * dia) / 162;
    const totalKgPerFooting = totalLengthM * unitWeight;
    const totalKgAll = totalKgPerFooting * count;

    // 4. Bundle Logic
    const bundle = STEEL_TABLE[dia];
    const reqBundles = totalKgAll / (bundle?.bundleWeight || 1);

    return { noOfBars, totalLengthM, totalKgAll, reqBundles };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setLoading(true);
    
    const file = e.target.files[0];
    const { data: { text } } = await Tesseract.recognize(file, 'eng');

    // Simple Logic: Scan text for "T1", "T2", etc. and count them
    const foundTags = ['T1', 'T2', 'T3', 'T4', 'T5'];
    const newResults = foundTags.map(tag => {
      const occurrences = (text.match(new RegExp(tag, 'g')) || []).length;
      
      // Default values from your example
      const mockData: any = {
        T1: { size: 4, dia: 10, space: 150 },
        T2: { size: 4.5, dia: 10, space: 120 },
        T3: { size: 5, dia: 12, space: 120 },
        T4: { size: 5.5, dia: 12, space: 120 },
        T5: { size: 6, dia: 12, space: 120 },
      };

      const data = mockData[tag];
      const calculations = calculateSteel(tag, data.size, data.dia, data.space, occurrences);

      return { tag, count: occurrences, ...data, ...calculations };
    });

    setResults(newResults.filter(r => r.count > 0));
    setLoading(false);
  };

  return (
    <div className="p-8 bg-white rounded-xl shadow-lg border border-gray-200">
      <h1 className="text-3xl font-black text-green-700 mb-6 uppercase italic">Footing BBS Automation</h1>
      
      <div className="mb-8 p-6 border-2 border-dashed border-green-300 rounded-lg text-center">
        <p className="mb-4 text-gray-600 font-bold">Upload Footing Layout Image</p>
        <input type="file" onChange={handleFileUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
      </div>

      {loading && <div className="text-center font-bold text-blue-600 animate-pulse">Scanning Drawing... Please wait...</div>}

      {results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-green-600 text-white uppercase text-xs">
                <th className="p-3 border border-green-700">Type</th>
                <th className="p-3 border border-green-700">Found Nos</th>
                <th className="p-3 border border-green-700">Bars (Both Sides)</th>
                <th className="p-3 border border-green-700 font-black">Total KGs</th>
                <th className="p-3 border border-green-700">Bundles</th>
              </tr>
            </thead>
            <tbody>
              {results.map((res, i) => (
                <tr key={i} className="hover:bg-green-50">
                  <td className="p-3 border font-bold">{res.tag}</td>
                  <td className="p-3 border text-blue-700 font-bold">{res.count}</td>
                  <td className="p-3 border">{res.noOfBars}</td>
                  <td className="p-3 border bg-yellow-100 font-black text-red-600">{res.totalKgAll.toFixed(2)}</td>
                  <td className="p-3 border">{res.reqBundles.toFixed(2)}</td>
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
