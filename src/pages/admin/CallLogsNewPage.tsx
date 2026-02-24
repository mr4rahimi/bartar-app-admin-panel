import { useEffect, useMemo, useRef, useState } from 'react';
import client from '../../api/client';
import { toast } from 'react-toastify';

type Service = { id: number; name: string };
type DeviceModel = { id: number; name: string; brandId: number; serviceId?: number | null };
type Problem = { id: number; name: string; serviceId: number };
type Part = { id: number; name: string; serviceId: number };
type ServiceRel = { service?: { id: number } };
type Brand = { id: number; name: string; services?: ServiceRel[] };

type CallLog = {
  id: number;
  date: string;
  operatorId: number;
  seq: number;
  callTime: string;
  subjectText: string;
  callerPhone: string;
  resultText?: string | null;
  finalStatus: 'PENDING' | 'FINAL';
  finalizedAt?: string | null;
  operator?: { id: number; name?: string | null; phone: string; role: string };
};

type SuggestItem =
  | { kind: 'brand'; id: number; label: string }
  | { kind: 'model'; id: number; label: string; brandId: number }
  | { kind: 'problem'; id: number; label: string }
  | { kind: 'part'; id: number; label: string };

function ymdLocal(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function hhmm(dtStr?: string) {
  if (!dtStr) return '';
  const d = new Date(dtStr);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function CallLogsNewPage() {
 
  const SERVICE_ID = 1;

  const [date, setDate] = useState<string>(ymdLocal());
  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<DeviceModel[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [parts, setParts] = useState<Part[]>([]);

  const [rows, setRows] = useState<CallLog[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);


  const [subject, setSubject] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState('');

  const subjectRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const resultRef = useRef<HTMLTextAreaElement | null>(null);

 
  const [showHelp, setShowHelp] = useState(false);

  // Autocomplete state
  const [query, setQuery] = useState('');
  const [acOpen, setAcOpen] = useState(false);
  const [acIndex, setAcIndex] = useState(0);

  const quickResults = ['ارسال پستی', 'انجام نمی شود', 'اعلام قیمت'];

  async function loadBase() {
    try {
      setLoadingBase(true);

      const [rs, rb, rmodels, rproblems, rparts] = await Promise.all([
  client.get<Service[]>('/admin/services'),
  client.get<Brand[]>('/admin/brands'),
  client.get<DeviceModel[]>('/admin/models', { params: { serviceId: SERVICE_ID } }),
  client.get<Problem[]>('/admin/problems'),
  client.get<Part[]>('/admin/parts'),
]);

      setServices(rs.data || []);
      setBrands(rb.data || []);
      setModels(Array.isArray(rmodels.data) ? rmodels.data : []);
      setProblems(Array.isArray(rproblems.data) ? rproblems.data : []);
      setParts(Array.isArray(rparts.data) ? rparts.data : []);
    } catch (e: unknown) {
      console.error(e);
      const message =
      typeof e === 'object' &&
      e !== null &&
     'response' in e &&
    (e as { response?: { data?: { message?: string } } }).response?.data?.message
      ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
      : 'خطا در عملیات';
  toast.error(message);
} finally {
      setLoadingBase(false);
    }
  }

  async function loadList(forDate: string) {
    try {
      setLoadingList(true);
      const r = await client.get<CallLog[]>('/admin/call-logs', {
        params: { date: forDate },
      });
     setRows(r.data ?? []);
      setSelectedRowId(null);
    } catch (e: unknown) {
  console.error(e);
  const message =
    typeof e === 'object' &&
    e !== null &&
    'response' in e &&
    (e as { response?: { data?: { message?: string } } }).response?.data?.message
      ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
      : 'خطا در عملیات';
  toast.error(message);
} finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadBase();
   
  }, []);

  useEffect(() => {
    loadList(date);
  
  }, [date]);


  const suggestionsAll: SuggestItem[] = useMemo(() => {
    const s: SuggestItem[] = [];

  
    const brandFiltered =
      brands?.filter((b) => (b.services || []).some((x) => x?.service?.id === SERVICE_ID)) || [];

    for (const b of brandFiltered) s.push({ kind: 'brand', id: b.id, label: b.name });

    for (const m of models || []) {
      s.push({ kind: 'model', id: m.id, label: m.name, brandId: m.brandId });
    }

    for (const p of problems || []) {
      if (p.serviceId === SERVICE_ID) s.push({ kind: 'problem', id: p.id, label: p.name });
    }

    for (const pt of parts || []) {
      if (pt.serviceId === SERVICE_ID) s.push({ kind: 'part', id: pt.id, label: pt.name });
    }

    return s;
  }, [brands, models, problems, parts]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return suggestionsAll
      .filter((x) => x.label.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, suggestionsAll]);

  function appendToSubject(label: string) {
    const current = (subject || '').trim();
    if (!current) return label;
   
    return `${current} / ${label}`;
  }

  function clearFormAndFocus() {
    setSubject('');
    setPhone('');
    setResult('');
    setQuery('');
    setAcOpen(false);
    setAcIndex(0);
    setTimeout(() => subjectRef.current?.focus(), 0);
  }

  async function submitQuick() {
    const subjectText = subject.trim();
    const callerPhone = phone.trim();
    const resultText = result.trim();

    if (!subjectText) {
      toast.error('هدف تماس را وارد کنید');
      subjectRef.current?.focus();
      return;
    }
    if (!callerPhone) {
      toast.error('شماره تماس گیرنده را وارد کنید');
      phoneRef.current?.focus();
      return;
    }

    try {
      setSubmitting(true);

      await client.post('/admin/call-logs', {
        date,
        subjectText,
        callerPhone,
        resultText: resultText || undefined,
        serviceId: SERVICE_ID,
      });

      await loadList(date);
      clearFormAndFocus();
    } catch (e: unknown) {
  console.error(e);
  const message =
    typeof e === 'object' &&
    e !== null &&
    'response' in e &&
    (e as { response?: { data?: { message?: string } } }).response?.data?.message
      ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
      : 'خطا در عملیات';
  toast.error(message);
} finally {
      setSubmitting(false);
    }
  }

  async function toggleFinalize(row: CallLog, finalized: boolean) {
    try {
      await client.patch(`/admin/call-logs/${row.id}/finalize`, { finalized });
      await loadList(date);
    } catch (e: unknown) {
  console.error(e);
  const message =
    typeof e === 'object' &&
    e !== null &&
    'response' in e &&
    (e as { response?: { data?: { message?: string } } }).response?.data?.message
      ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
      : 'خطا در عملیات';
  toast.error(message);
}
  }

  function onSubjectKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Autocomplete navigation
    if (acOpen && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAcIndex((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAcIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {

        e.preventDefault();
        const chosen = suggestions[acIndex];
        if (chosen) {
          const next = appendToSubject(chosen.label);
          setSubject(next);
          setQuery('');
          setAcOpen(false);
          setAcIndex(0);

          setTimeout(() => phoneRef.current?.focus(), 0);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setAcOpen(false);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      submitQuick();
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      clearFormAndFocus();
      return;
    }

    if (e.key === 'F1') {
      e.preventDefault();
      setShowHelp((v) => !v);
      return;
    }
  }

  function onGlobalKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
 
    if (e.key === 'F1') {
      e.preventDefault();
      setShowHelp((v) => !v);
      return;
    }


    if (e.key.toLowerCase() === 'f' && selectedRowId) {
      e.preventDefault();
      const row = rows.find((r) => r.id === selectedRowId);
      if (!row) return;
      const next = row.finalStatus !== 'FINAL';
      toggleFinalize(row, next);
      return;
    }
  }

  const serviceName = useMemo(() => {
    return services.find((s) => s.id === SERVICE_ID)?.name || `#${SERVICE_ID}`;
  }, [services]);

  return (
    <div className="bp-page-aurora-2025" onKeyDown={onGlobalKeyDown} tabIndex={0}>
      {/* Header */}
      <div className="bp-surface-aurora-2025" style={{ padding: 16, borderRadius: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0 }}>ثبت تماس جدید</h3>
            <div style={{ opacity: 0.8, marginTop: 6 }}>
              سرویس: <b>{serviceName}</b>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 13, opacity: 0.85 }}>تاریخ:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input"
              style={{ minWidth: 160 }}
            />
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => setShowHelp((v) => !v)}
              title="راهنما (F1)"
            >
              راهنمای کیبورد
            </button>
          </div>
        </div>
      </div>

      {/* Help */}
      {showHelp && (
        <div className="bp-surface-aurora-2025" style={{ padding: 16, borderRadius: 16, marginBottom: 16 }}>
          <h4 style={{ marginTop: 0 }}>راهنمای کیبورد</h4>
          <ul style={{ margin: 0, paddingInlineStart: 18, lineHeight: 1.9 }}>
            <li><b>Enter</b>: ثبت سریع تماس (وقتی autocomplete باز نیست)</li>
            <li><b>↑ / ↓</b>: حرکت در پیشنهادهای هدف تماس (autocomplete)</li>
            <li><b>Enter</b>: انتخاب پیشنهاد (وقتی autocomplete باز است)</li>
            <li><b>Tab / Shift+Tab</b>: رفتن به فیلد بعد/قبل</li>
            <li><b>Esc</b>: پاک کردن فرم</li>
            <li><b>F</b>: قطعی/غیرقطعی کردن ردیف انتخاب‌شده در جدول</li>
            <li><b>F1</b>: نمایش/مخفی راهنما</li>
          </ul>
        </div>
      )}

      {/* Quick Entry */}
      <div className="bp-surface-aurora-2025" style={{ padding: 16, borderRadius: 16, marginBottom: 16 }}>
        <h4 style={{ marginTop: 0 }}>ثبت سریع</h4>

        {loadingBase ? (
          <div>در حال بارگذاری داده‌های پایه...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: 12 }}>
              {/* Subject */}
              <div style={{ position: 'relative' }}>
                <label className="form-label">هدف تماس</label>
                <input
                  ref={subjectRef}
                  className="form-input"
                  placeholder="مثلاً: اپل / آیفون 12 / ال سی دی"
                  value={subject}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSubject(v);
                   
                    const last = v.split('/').pop() || '';
                    const q = last.trim();
                    setQuery(q);
                    setAcOpen(!!q);
                    setAcIndex(0);
                  }}
                  onKeyDown={onSubjectKeyDown}
                  onFocus={() => {
                    const last = subject.split('/').pop() || '';
                    const q = last.trim();
                    setQuery(q);
                    setAcOpen(!!q);
                  }}
                  onBlur={() => {
       
                    setTimeout(() => setAcOpen(false), 150);
                  }}
                />

                {/* Dropdown */}
                {acOpen && query.trim() && suggestions.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 72,
                      left: 0,
                      right: 0,
                      background: 'var(--bp-surface, #111827)',
                      color: 'var(--bp-text, #fff)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: 12,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                      zIndex: 20,
                      overflow: 'hidden',
                      maxHeight: 320,
                    }}
                  >
                    {suggestions.map((s, idx) => (
                      <button
                        key={`${s.kind}-${s.id}`}
                        type="button"
                        style={{
                          width: '100%',
                          textAlign: 'right',
                          padding: '10px 12px',
                          border: 'none',
                          background: idx === acIndex ? 'rgba(0,0,0,0.06)' : 'transparent',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={() => setAcIndex(idx)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const next = appendToSubject(s.label);
                          setSubject(next);
                          setQuery('');
                          setAcOpen(false);
                          setAcIndex(0);
                          setTimeout(() => phoneRef.current?.focus(), 0);
                        }}
                      >
                        <div style={{ fontSize: 13, opacity: 0.7 }}>
                          {s.kind === 'brand' && 'برند'}
                          {s.kind === 'model' && 'مدل'}
                          {s.kind === 'problem' && 'مشکل'}
                          {s.kind === 'part' && 'قطعه'}
                        </div>
                        <div style={{ fontWeight: 600 }}>{s.label}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="form-label">شماره تماس گیرنده</label>
                <input
                  ref={phoneRef}
                  className="form-input"
                  placeholder="مثلاً 0912..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      resultRef.current?.focus();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      clearFormAndFocus();
                    }
                  }}
                />
              </div>

              {/* Result */}
              <div>
                <label className="form-label">نتیجه تماس</label>
                <textarea
                  ref={resultRef}
                  className="form-input"
                  placeholder="یادداشت نتیجه..."
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submitQuick();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      clearFormAndFocus();
                    }
                  }}
                />

                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {quickResults.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        const cur = result.trim();
                        const next = cur ? `${cur} - ${t}` : t;
                        setResult(next);
                        resultRef.current?.focus();
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={submitting}
                onClick={submitQuick}
                title="Enter"
              >
                {submitting ? 'در حال ثبت...' : 'ثبت تماس'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={clearFormAndFocus} title="Esc">
                پاک کردن
              </button>
            </div>
          </>
        )}
      </div>

      {/* Table */}
      <div className="bp-surface-aurora-2025" style={{ padding: 16, borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h4 style={{ margin: 0 }}>تماس‌های تاریخ {date}</h4>
          <button type="button" className="btn btn-ghost" onClick={() => loadList(date)}>
            بروزرسانی
          </button>
        </div>

        {loadingList ? (
          <div style={{ marginTop: 12 }}>در حال بارگذاری...</div>
        ) : rows.length === 0 ? (
          <div style={{ marginTop: 12, opacity: 0.75 }}>برای این تاریخ تماسی ثبت نشده.</div>
        ) : (
          <div style={{ marginTop: 12, overflowX: 'auto' }}>
           <table className="bp-partpricing-table bp-calllogs-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>اپراتور</th>
                  <th>ردیف</th>
                  <th>ساعت تماس</th>
                  <th>هدف</th>
                  <th>شماره</th>
                  <th>نتیجه</th>
                  <th>قطعی</th>
                  <th>ساعت نتیجه</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const selected = r.id === selectedRowId;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRowId(r.id)}
                      style={{ background: selected ? 'rgba(0,0,0,0.04)' : undefined, cursor: 'pointer' }}
                      title="برای انتخاب ردیف کلیک کنید (F برای قطعی)"
                    >
                      <td>{r.operator?.name || r.operator?.phone || `#${r.operatorId}`}</td>
                      <td>{r.seq}</td>
                      <td>{hhmm(r.callTime)}</td>
                      <td style={{ minWidth: 260 }}>{r.subjectText}</td>
                      <td>{r.callerPhone}</td>
                      <td style={{ minWidth: 240 }}>{r.resultText || ''}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={r.finalStatus === 'FINAL'}
                          onChange={(e) => toggleFinalize(r, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td>{r.finalizedAt ? hhmm(r.finalizedAt) : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
              نکته: برای قطعی/غیرقطعی کردن سریع، ردیف را انتخاب کن و کلید <b>F</b> را بزن.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}