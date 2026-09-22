import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ReportCategory } from '../types';
import { X, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

const REPORT_CATEGORIES: ReportCategory[] = [
  'Harassment',
  'Spam',
  'Fake Profile',
  'Unwanted Content',
  'Abuse',
  'Underage (Under 18)',
  'Other',
];

export const SafetyModal: React.FC = () => {
  const { reportModalUser, setReportModalUser, submitReport, blockUser } = useApp();

  const [category, setCategory] = useState<ReportCategory>('Harassment');
  const [description, setDescription] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  if (!reportModalUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalUser) return;

    submitReport(reportModalUser, category, description || `Reported for ${category}`);

    if (alsoBlock) {
      blockUser(reportModalUser.id);
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setReportModalUser(null);
    }, 1600);
  };

  return (
    <div id="safety-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div id="safety-modal-card" className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative my-auto animate-in zoom-in-95 duration-200">
        
        <button
          onClick={() => setReportModalUser(null)}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Report Submitted to Moderators</h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Thank you for keeping GlobalMeet safe. Our 24/7 admin team is reviewing this profile immediately.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Report {reportModalUser.name}</h3>
                <p className="text-[11px] text-neutral-400">Select reason for policy violation</p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">Violation Category</label>
              <div className="grid grid-cols-2 gap-2">
                {REPORT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-2.5 rounded-xl text-left text-xs font-medium border transition ${
                      category === cat
                        ? 'bg-rose-950/80 border-rose-600 text-rose-300 font-semibold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                id="report-description"
                placeholder="Describe what happened during chat or video call..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <label className="flex items-center space-x-2 text-xs text-neutral-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-rose-600 accent-rose-500"
              />
              <span>Also block {reportModalUser.name} immediately</span>
            </label>

            <button
              type="submit"
              id="btn-submit-report"
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 active:scale-[0.98] transition"
            >
              Submit Report to Admin
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
