import { useState } from 'react';
import { Printer, GraduationCap } from 'lucide-react';
import { useOfferings } from '../utils/offerings';

export default function PaperForm() {
  const offerings = useOfferings();
  const [semesterLabel, setSemesterLabel] = useState('Fall 2025');
  const [mailingAddress, setMailingAddress] = useState(
    'Schola Academy\nAttn: Registrar\n123 Main Street\nAnytown, ST 00000',
  );

  const membershipFee = 50;

  return (
    <div className="space-y-4">
      {/* Controls (hidden during print) */}
      <div className="card print:hidden space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mail-in registration form</h1>
            <p className="text-gray-500 text-sm mt-1">
              Print this form on Letter paper and include it as the back page of the catalog.
              Registrants mark the offerings they'd like to join, enclose a check or cash, and mail it in.
            </p>
          </div>
          <button onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Semester label</label>
            <input
              type="text" value={semesterLabel}
              onChange={e => setSemesterLabel(e.target.value)}
              className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mailing address</label>
            <textarea
              value={mailingAddress} onChange={e => setMailingAddress(e.target.value)} rows={3}
              className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 leading-snug focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Printable sheet — sized to Letter portrait */}
      <article
        className="paper-sheet mx-auto bg-white text-black shadow-xl print:shadow-none"
        style={{ width: '8.5in', minHeight: '11in' }}
      >
        <div className="px-[0.6in] py-[0.55in] space-y-4" style={{ fontSize: '11pt' }}>
          {/* Heading */}
          <header className="flex items-start justify-between border-b-2 border-black pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black rounded flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="text-xl font-extrabold tracking-tight leading-tight">SCHOLA ACADEMY</div>
                <div className="text-xs uppercase tracking-widest">Continuing Education</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold uppercase tracking-widest">Registration Form</div>
              <div className="text-xs">{semesterLabel}</div>
            </div>
          </header>

          <p className="text-sm leading-snug">
            Please print clearly. Mark the courses you'd like to take, enclose a check made payable to
            <strong> Schola Academy</strong> (or exact cash), and mail this form to the address below.
            You may also drop it off at the registration desk.
          </p>

          {/* Registrant block */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-1">Your information</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Field label="First name"   />
              <Field label="Last name"    />
              <Field label="Date of birth (MM / DD / YYYY)" />
              <Field label="Phone"        />
              <Field label="Email"        full />
              <Field label="Street address" full />
              <Field label="City"         />
              <div className="grid grid-cols-2 gap-4">
                <Field label="State" />
                <Field label="ZIP"   />
              </div>
            </div>
          </section>

          {/* Offerings */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-1">Offerings — check all that apply</h2>
            <table className="w-full border-collapse text-[10.5pt]">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left py-1 pr-2 w-[0.35in]"></th>
                  <th className="text-left py-1 pr-2">Code / Title</th>
                  <th className="text-left py-1 pr-2 w-[1.3in]">Day / Time</th>
                  <th className="text-right py-1 pl-2 w-[0.55in]">Fee</th>
                </tr>
              </thead>
              <tbody>
                {offerings.map(c => (
                  <tr key={c.id} className="border-b border-gray-400 align-top">
                    <td className="py-1.5">
                      {/* big empty checkbox */}
                      <span className="inline-block w-4 h-4 border-2 border-black" aria-hidden="true" />
                    </td>
                    <td className="py-1.5 pr-2">
                      <div className="font-semibold">{c.id} · {c.title}</div>
                      <div className="text-[9.5pt] text-gray-700">{c.instructor} · {c.format}</div>
                    </td>
                    <td className="py-1.5 pr-2 whitespace-nowrap">{c.day}s · {c.time}</td>
                    <td className="py-1.5 pl-2 text-right font-semibold">${c.fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Payment */}
          <section className="grid grid-cols-2 gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-1">Payment</h2>
              <div className="border border-black rounded p-2 space-y-1 text-[10.5pt]">
                <label className="flex items-center gap-2"><span className="inline-block w-3.5 h-3.5 border-2 border-black" /> Check enclosed</label>
                <label className="flex items-center gap-2"><span className="inline-block w-3.5 h-3.5 border-2 border-black" /> Cash enclosed</label>
                <label className="flex items-center gap-2"><span className="inline-block w-3.5 h-3.5 border-2 border-black" /> Please call me to pay by card</label>
                <div className="pt-1 border-t border-gray-400 mt-1">
                  Annual membership (optional, <strong>${membershipFee}</strong>):
                  <span className="inline-block w-3.5 h-3.5 border-2 border-black ml-2 align-middle" />
                </div>
                <div>
                  Donation (tax-deductible):  $<span className="inline-block border-b border-black w-20 align-bottom" />
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-1">Amount enclosed</h2>
              <div className="border-2 border-black rounded p-3 text-center">
                <div className="text-[9pt] uppercase tracking-widest">Total enclosed</div>
                <div className="text-2xl font-black mt-1">$ <span className="inline-block border-b-2 border-black w-32 align-bottom" /></div>
                <div className="text-[9pt] mt-2">
                  If your enclosed amount does not match the total of checked offerings,
                  our registrar will contact you. Please do not send cash by mail.
                </div>
              </div>
            </div>
          </section>

          {/* Signature + mailing */}
          <section className="grid grid-cols-2 gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-1">Signature</h2>
              <div className="h-10 border-b border-black" />
              <div className="text-[9pt] mt-1 text-gray-700">Signed</div>
              <div className="h-10 border-b border-black mt-2" />
              <div className="text-[9pt] mt-1 text-gray-700">Date</div>
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-1">Mail to</h2>
              <pre className="font-sans text-[11pt] leading-snug whitespace-pre-wrap border border-black rounded p-2">
{mailingAddress}
              </pre>
            </div>
          </section>

          <footer className="pt-2 border-t border-black text-[9pt] text-gray-700 text-center">
            Office use only: Received __________ · Entered __________ · Reg # __________
          </footer>
        </div>
      </article>

      <style>{`
        @media print {
          @page { size: letter portrait; margin: 0; }
          body { background: #fff !important; }
          body * { visibility: hidden !important; }
          .paper-sheet, .paper-sheet * { visibility: visible !important; }
          .paper-sheet { position: absolute; left: 0; top: 0; width: 100% !important; box-shadow: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, full = false }: { label: string; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <div className="text-[9pt] uppercase tracking-widest text-gray-700">{label}</div>
      <div className="h-6 border-b border-black" />
    </div>
  );
}
