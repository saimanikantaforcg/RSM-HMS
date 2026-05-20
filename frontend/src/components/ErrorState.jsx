import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function ErrorState({ title = "Service Interaction Failed", message = "We encountered a persistent error while fetching this data. Clinical safety is our priority—please do not assume records are empty.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-red-50/30 rounded-3xl border border-red-100/50">
      <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-6 animate-pulse">
        <AlertTriangle size={32} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="btn-primary flex items-center gap-2 bg-red-600 hover:bg-red-700 border-none px-8"
        >
          <RefreshCcw size={16} /> Re-establish Connection
        </button>
      )}
    </div>
  );
}
