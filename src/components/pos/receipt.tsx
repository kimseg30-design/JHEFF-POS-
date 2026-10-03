'use client';

import { useRef } from 'react';
import { Printer, Download, X, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { StoreInfo, Branch, TransactionItem } from '@/lib/db/idb';

interface ReceiptProps {
  store: StoreInfo | null;
  branch: Branch | null;
  ticketNumber: string;
  orNumber?: string; // Added for OR numbering
  timestamp: number;
  items: any[];
  total: number;
  vatableSales?: number;
  vatAmount?: number;
  taxType?: 'VAT' | 'NON-VAT';
  paymentMethod: string;
  type?: 'sales' | 'ewallet';
  ewalletDetails?: {
    type: string;
    method: string;
    fee: number;
    customerName?: string;
    referenceNumber?: string;
  };
  onClose: () => void;
}

const ReceiptHeader = ({ store, branch, ticketNumber, orNumber, timestamp, type }: any) => (
  <div className="text-center">
    <h2 className="text-lg font-bold uppercase tracking-tighter leading-tight">{store?.name || 'Sari-Sari POS'}</h2>
    {store?.address && <p className="text-[10px] font-bold leading-tight">{store.address}</p>}
    {store?.tin && <p className="text-[10px] font-bold leading-tight">TIN: {store.tin}</p>}
    {branch?.name && branch.name !== 'Main Branch' && <p className="text-[10px] font-bold leading-tight">{branch.name}</p>}
    <div className="border-t border-dashed border-black my-3" />
    
    <div className="space-y-0.5 mb-4 text-left text-[10px]">
      <div className="flex justify-between">
        <span>Ticket:</span>
        <span className="font-bold">{ticketNumber}</span>
      </div>
      {orNumber && (
        <div className="flex justify-between">
          <span>OR Number:</span>
          <span className="font-bold">{orNumber}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span>Date:</span>
        <span>{format(timestamp, 'MMM dd, yyyy')}</span>
      </div>
      <div className="flex justify-between">
        <span>Time:</span>
        <span>{format(timestamp, 'hh:mm a')}</span>
      </div>
      <div className="flex justify-between">
        <span>Type:</span>
        <span className="uppercase font-bold">{type === 'sales' ? 'Sales Receipt' : 'E-Wallet Receipt'}</span>
      </div>
    </div>
    <div className="border-t border-dashed border-black my-3" />
  </div>
);

const SalesItems = ({ items }: { items: any[] }) => (
  <div className="space-y-2 mb-4">
    <div className="flex justify-between font-bold text-[10px] uppercase">
      <span className="w-1/2">Item</span>
      <span className="w-1/4 text-center">Qty</span>
      <span className="w-1/4 text-right">Price</span>
    </div>
    {items.map((item, i) => (
      <div key={i} className="flex justify-between items-start">
        <span className="w-1/2 break-words">{item.name}</span>
        <span className="w-1/4 text-center">x{(item.quantity || item.qty)}</span>
        <span className="w-1/4 text-right">₱{(item.price * (item.quantity || item.qty)).toFixed(2)}</span>
      </div>
    ))}
  </div>
);

const EWalletDetails = ({ details, total }: { details: any, total: number }) => (
  <div className="space-y-2 mb-4">
    <div className="flex justify-between">
      <span>Type:</span>
      <span className="font-bold uppercase">{details?.type}</span>
    </div>
    <div className="flex justify-between">
      <span>Method:</span>
      <span className="font-bold uppercase">{details?.method?.replace('_', ' ')}</span>
    </div>
    <div className="flex justify-between">
      <span>Amount:</span>
      <span className="font-bold">₱{total.toFixed(2)}</span>
    </div>
    <div className="flex justify-between">
      <span>Fee:</span>
      <span className="font-bold">₱{details?.fee.toFixed(2)}</span>
    </div>
    {details?.customerName && (
      <div className="flex justify-between">
        <span>Customer:</span>
        <span className="font-bold">{details.customerName}</span>
      </div>
    )}
    {details?.referenceNumber && (
      <div className="flex justify-between">
        <span>Ref Number:</span>
        <span className="font-bold">{details.referenceNumber}</span>
      </div>
    )}
  </div>
);

const ReceiptFooter = ({ total, paymentMethod, type, ewalletDetails, vatableSales, vatAmount, taxType }: any) => {
  const vatExempt = 0;
  const zeroRated = 0;
  
  return (
    <>
      <div className="border-t border-dashed border-black my-3" />
      <div className="space-y-1 mb-6">
        {taxType === 'VAT' && type === 'sales' && (
          <div className="space-y-0.5 mb-2 text-[10px]">
            <div className="flex justify-between opacity-70">
              <span>VATable Sales:</span>
              <span>₱{vatableSales?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between opacity-70">
              <span>VAT (12%):</span>
              <span>₱{vatAmount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between opacity-70">
              <span>VAT-Exempt Sales:</span>
              <span>₱{vatExempt.toFixed(2)}</span>
            </div>
            <div className="flex justify-between opacity-70">
              <span>Zero Rated Sales:</span>
              <span>₱{zeroRated.toFixed(2)}</span>
            </div>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold">
          <span>{type === 'sales' ? 'TOTAL:' : 'GRAND TOTAL:'}</span>
          <span>₱{(type === 'sales' ? total : total + (ewalletDetails?.fee || 0)).toFixed(2)}</span>
        </div>
        <div className="flex justify-between opacity-70 text-[10px]">
          <span>Payment:</span>
          <span className="uppercase font-bold">{paymentMethod}</span>
        </div>
      </div>
      <div className="text-center mt-8 space-y-1">
        <p className="font-bold uppercase text-[10px]">Salamat Po!</p>
        <p className="text-[8px] opacity-60">Please keep this receipt for your records.</p>
        <p className="text-[8px] opacity-40 mt-2 italic">Official Receipt</p>
        <p className="text-[8px] opacity-40">Powered by Sari-Sari POS</p>
      </div>
    </>
  );
};

export function Receipt({ 
  store, 
  branch, 
  ticketNumber, 
  orNumber,
  timestamp, 
  items, 
  total, 
  paymentMethod,
  type = 'sales',
  ewalletDetails,
  vatableSales,
  vatAmount,
  taxType,
  onClose
}: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = receiptRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, canvas.height * 80 / canvas.width]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, 80, canvas.height * 80 / canvas.width);
    pdf.save(`receipt-${ticketNumber}.pdf`);
  };

  const handleShare = async () => {
    const element = receiptRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `Receipt-${ticketNumber}.png`, { type: 'image/png' });
        
        if (navigator.share) {
          await navigator.share({
            title: 'Sari-Sari Receipt',
            text: `Receipt for ticket ${ticketNumber}`,
            files: [file]
          });
        } else {
          // Fallback to download
          handleDownloadPDF();
        }
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Actions Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="p-3 bg-white hover:bg-gray-100 rounded-xl text-gray-900 border border-gray-200 shadow-sm transition-all"
              title="Print Receipt"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="p-3 bg-white hover:bg-gray-100 rounded-xl text-gray-900 border border-gray-200 shadow-sm transition-all"
              title="Download PDF"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              onClick={handleShare}
              className="p-3 bg-white hover:bg-gray-100 rounded-xl text-gray-900 border border-gray-200 shadow-sm transition-all"
              title="Share Receipt"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white hover:bg-gray-100 rounded-xl text-gray-400 border border-gray-200 shadow-sm transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content (Preview) */}
        <div className="p-8 bg-gray-100 flex justify-center overflow-y-auto max-h-[70vh]">
          <div 
            id="printable-receipt"
            ref={receiptRef}
            className="bg-white w-[80mm] p-6 shadow-lg font-mono text-[12px] leading-tight text-black"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            <ReceiptHeader 
              store={store} 
              branch={branch} 
              ticketNumber={ticketNumber} 
              orNumber={orNumber}
              timestamp={timestamp} 
              type={type} 
            />
            
            {type === 'sales' ? (
              <SalesItems items={items} />
            ) : (
              <EWalletDetails details={ewalletDetails} total={total} />
            )}

            <ReceiptFooter 
              total={total} 
              paymentMethod={paymentMethod} 
              type={type} 
              ewalletDetails={ewalletDetails} 
              vatableSales={vatableSales}
              vatAmount={vatAmount}
              taxType={taxType}
            />
          </div>
        </div>

        <div className="p-6 bg-white">
          <button 
            onClick={onClose}
            className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-sm shadow-lg active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
