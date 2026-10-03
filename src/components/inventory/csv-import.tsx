'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, Check, AlertCircle, X, Loader2, ArrowRight, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '@/lib/db/idb';

interface CsvImportProps {
  onImport: (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'branchId'>[]) => Promise<void>;
  onClose: () => void;
}

interface ValidatedProduct {
  name: string;
  price: number;
  cost: number;
  category: string;
  stock: number;
}

interface ImportError {
  row: number;
  message: string;
}

interface FieldMapping {
  name: string;
  price: string;
  cost: string;
  category: string;
  stock: string;
}

export function CsvImport({ onImport, onClose }: CsvImportProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<FieldMapping>({
    name: '',
    price: '',
    cost: '',
    category: '',
    stock: ''
  });
  const [parsedData, setParsedData] = useState<ValidatedProduct[]>([]);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields) {
          setHeaders(results.meta.fields);
          setRawRows(results.data);
          
          // Try to auto-map based on common names
          const newMapping = { ...mapping };
          results.meta.fields.forEach(h => {
            const lower = h.toLowerCase();
            if (lower.includes('name') || lower === 'title') newMapping.name = h;
            if (lower.includes('price') || lower === 'selling price') newMapping.price = h;
            if (lower.includes('cost') || lower === 'purchase price') newMapping.cost = h;
            if (lower.includes('category') || lower === 'type') newMapping.category = h;
            if (lower.includes('stock') || lower.includes('qty') || lower === 'quantity') newMapping.stock = h;
          });
          setMapping(newMapping);
          setStep('mapping');
        }
      },
      error: (error) => {
        console.error('CSV Parsing Error:', error);
        alert('Failed to parse CSV file.');
      }
    });
  };

  const validateAndPreview = () => {
    const validProducts: ValidatedProduct[] = [];
    const validationErrors: ImportError[] = [];

    rawRows.forEach((row, index) => {
      const rowNum = index + 2;
      const name = row[mapping.name]?.toString().trim();
      const price = parseFloat(row[mapping.price]?.toString().replace(/[^0-9.]/g, '') || '');
      const cost = parseFloat(row[mapping.cost]?.toString().replace(/[^0-9.]/g, '') || '0');
      const category = row[mapping.category]?.toString().trim() || 'Uncategorized';
      const stock = parseInt(row[mapping.stock]?.toString() || '0', 10);

      if (!name) {
        validationErrors.push({ row: rowNum, message: 'Missing product name' });
        return;
      }

      if (isNaN(price)) {
        validationErrors.push({ row: rowNum, message: 'Invalid or missing price' });
        return;
      }

      validProducts.push({
        name,
        price,
        cost: isNaN(cost) ? 0 : cost,
        category,
        stock: isNaN(stock) ? 0 : stock
      });
    });

    setParsedData(validProducts);
    setErrors(validationErrors);
    setStep('preview');
  };

  const handleConfirmImport = async () => {
    if (parsedData.length === 0) return;
    
    setIsImporting(true);
    try {
      await onImport(parsedData);
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import products.');
    } finally {
      setIsImporting(false);
    }
  };

  const isMappingComplete = mapping.name && mapping.price;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="bg-orange-600 p-3 rounded-2xl text-white shadow-lg shadow-orange-100">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Import Products</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Step {step === 'upload' ? '1' : step === 'mapping' ? '2' : '3'} of 3
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white hover:bg-gray-100 rounded-2xl text-gray-400 transition-colors border border-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full flex flex-col items-center justify-center text-center py-12"
              >
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-md p-12 border-4 border-dashed border-gray-100 rounded-[3rem] hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer group"
                >
                  <div className="bg-gray-50 group-hover:bg-white p-8 rounded-[2rem] mb-6 inline-block transition-colors">
                    <FileText className="w-16 h-16 text-gray-300 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Choose CSV File</h4>
                  <p className="text-gray-400 text-sm mb-8">Click to browse or drag and drop your file here</p>
                  
                  <div className="space-y-2 text-left bg-white p-6 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Required Fields:</p>
                    <div className="flex flex-wrap gap-2">
                      {['name', 'price', 'cost'].map(header => (
                        <span key={header} className="px-3 py-1 bg-orange-50 rounded-lg text-[10px] font-bold text-orange-600 uppercase tracking-wider border border-orange-100">
                          {header}
                        </span>
                      ))}
                      {['category', 'stock'].map(header => (
                        <span key={header} className="px-3 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-600 uppercase tracking-wider border border-gray-100">
                          {header}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv"
                  className="hidden"
                />
              </motion.div>
            )}

            {step === 'mapping' && (
              <motion.div
                key="mapping"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex items-start gap-4">
                  <Settings2 className="w-6 h-6 text-orange-600 mt-1" />
                  <div>
                    <h4 className="font-black text-orange-900 uppercase tracking-tight">Map CSV Columns</h4>
                    <p className="text-orange-700/70 text-sm">Select which column in your CSV matches our product fields.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(['name', 'price', 'cost', 'category', 'stock'] as const).map((field) => (
                    <div key={field} className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                        {field} {['name', 'price'].includes(field) && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        value={mapping[field]}
                        onChange={(e) => setMapping(prev => ({ ...prev, [field]: e.target.value }))}
                        className="w-full p-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none font-bold text-gray-700"
                      >
                        <option value="">Select Column...</option>
                        {headers.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Data Sample (First Row)</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {headers.slice(0, 8).map(h => (
                      <div key={h} className="bg-white p-3 rounded-xl border border-gray-100">
                        <p className="text-[8px] font-black text-gray-400 uppercase truncate">{h}</p>
                        <p className="text-xs font-bold text-gray-700 truncate">{rawRows[0]?.[h] || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                {errors.length > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <h4 className="font-black text-red-900 uppercase tracking-tight">Validation Errors ({errors.length})</h4>
                    </div>
                    <p className="text-red-700 text-sm mb-4">The following rows will be skipped during import.</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      {errors.map((error, i) => (
                        <div key={i} className="text-sm text-red-600 bg-white/50 p-3 rounded-xl border border-red-50">
                          <span className="font-bold">Row {error.row}:</span> {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
                  <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                    <h4 className="font-black text-gray-900 uppercase tracking-tight">Preview Data ({parsedData.length} valid rows)</h4>
                    <button 
                      onClick={() => setStep('mapping')}
                      className="text-xs font-black text-orange-600 uppercase tracking-widest hover:underline"
                    >
                      Adjust Mapping
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/30">
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Name</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Price</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Cost</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Category</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {parsedData.slice(0, 50).map((product, i) => (
                          <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-900">{product.name}</td>
                            <td className="px-6 py-4 font-mono text-gray-600">₱{product.price.toFixed(2)}</td>
                            <td className="px-6 py-4 font-mono text-emerald-600">₱{product.cost.toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase">
                                {product.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-900">{product.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedData.length > 50 && (
                      <div className="p-4 text-center text-gray-400 text-xs font-medium bg-gray-50/30">
                        Showing first 50 rows...
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex gap-4">
            {step === 'mapping' && (
              <button
                onClick={validateAndPreview}
                disabled={!isMappingComplete}
                className="bg-gray-900 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white font-black px-10 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 uppercase text-xs tracking-widest"
              >
                Preview Data
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 'preview' && (
              <button
                onClick={handleConfirmImport}
                disabled={parsedData.length === 0 || isImporting}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black px-10 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 uppercase text-xs tracking-widest"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirm Import ({parsedData.length})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
