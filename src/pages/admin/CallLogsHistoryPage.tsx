import { useEffect, useMemo, useRef, useState } from 'react';
import client from '../../api/client';
import { toast } from 'react-toastify';

type Service = { id: number; name: string };
type CallLogRow = {
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
  serviceId?: number | null;
  operator?: { id: number; name?: string | null; phone: string; role: string };
};

type HistoryResponse = {
  total: number;
  items: CallLogRow[];
  skip: number;
  take: number;
};

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

export default function CallLogsHistoryPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingBase, setLoadingBase] = useState(true);

  // filters
  const [from, setFrom] = useState<string>(() => ymdLocal(new Date(Date.now() - 7 * 24 * 3600 * 1000)));
  const [to, setTo] = useState<string>(() => ymdLocal());
  const [serviceId, setServiceId] = useState<number | ''>('');
  const [q, setQ] = useState('');

  // debounced query
  const [qDebounced, setQDebounced] = useState('');
  const debounceRef = useRef<number | null>(null);

  // list
  const [loadingList, setLoadingList] = useState(false);
  const [rows, setRows] = useState<CallLogRow[]>([]);
  const [total, setTotal] = useState(0);

  // pagination
  const [skip, setSkip] = useState(0);
  const take = 50;

  async function loadBase() {
    try {
      setLoadingBase(true);
      const rs = await client.get<Service[]>('/admin/services');
      setServices(rs.data || []);
    } catch (e: unknown) {
      console.error(e);
      toast.error('خطا در دریافت سرویس‌ها');
    } finally {
      setLoadingBase(false);
    }
  }

  async function loadList(nextSkip = skip, nextQ = qDebounced, nextFrom = from, nextTo = to, nextServiceId = serviceId) {
    try {
      setLoadingList(true);
      const r = await client.get<HistoryResponse>('/admin/call-logs/history', {
        params: {
          from: nextFrom || undefined,
          to: nextTo || undefined,
          serviceId: nextServiceId === '' ? undefined : nextServiceId,
          q: nextQ.trim() || undefined,
          skip: nextSkip,
          take,
        },
      });

      setRows(r.data?.items || []);
      setTotal(r.data?.total || 0);
    } catch (e: unknown) {
      console.error(e);
      const message =
        typeof e === 'object' &&
        e !== null &&
        'response' in e &&
        (e as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'خطا در دریافت تاریخچه تماس‌ها';
      toast.error(message);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadBase();
  }, []);

  // debounce q
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setQDebounced(q), 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q]);

  // when filters change -> reset skip -> reload
  useEffect(() => {
    setSkip(0);
  }, [from, to, serviceId, qDebounced]);

  useEffect(() => {
    loadList(skip);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, from, to, serviceId, qDebounced]);

  const pageFrom = useMemo(() => (total === 0 ? 0 : skip + 1), [skip, total]);
  const pageTo = useMemo(() => Math.min(skip + take, total), [skip, take, total]);
  const canPrev = skip > 0;
  const canNext = skip + take < total;

  return (
    <div className="bp-page-aurora-2025">
      {/* Header */}
      <div className="bp-surface-aurora-2025" style={{ padding: 16, borderRadius: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0 }}>تاریخچه تماس‌ها</h3>
            <div style={{ opacity: 0.8, marginTop: 6 }}>
             تاریخچه تماس ها
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost" onClick={() => loadList(0)} disabled={loadingList}>
              بروزرسانی
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bp-surface-aurora-2025" style={{ padding: 16, borderRadius: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 2fr', gap: 12, alignItems: 'end' }}>
          <div>
            <label className="form-label">از تاریخ</label>
            <input className="form-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div>
            <label className="form-label">تا تاریخ</label>
            <input className="form-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <div>
            <label className="form-label">سرویس</label>
            <select
              className="form-input"
              value={serviceId}
              onChange={(e) => {
                const v = e.target.value;
                setServiceId(v === '' ? '' : Number(v));
              }}
              disabled={loadingBase}
            >
              <option value="">همه سرویس‌ها</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">جستجو زنده (شماره/هدف/نتیجه/اپراتور...)</label>
            <input
              className="form-input"
              placeholder="مثلاً: 0912 یا ارسال پستی یا آیفون 12 ..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setFrom(ymdLocal(new Date(Date.now() - 7 * 24 * 3600 * 1000)));
              setTo(ymdLocal());
              setServiceId('');
              setQ('');
            }}
          >
            پاک کردن فیلترها
          </button>

          <div style={{ fontSize: 12, opacity: 0.7, alignSelf: 'center' }}>
            نمایش {pageFrom} تا {pageTo} از {total.toLocaleString('fa-IR')}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bp-surface-aurora-2025" style={{ padding: 16, borderRadius: 16 }}>
        {loadingList ? (
          <div style={{ opacity: 0.8 }}>در حال بارگذاری...</div>
        ) : rows.length === 0 ? (
          <div style={{ opacity: 0.75 }}>موردی مطابق فیلتر/جستجو یافت نشد.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="bp-partpricing-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>تاریخ</th>
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
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.date).toLocaleDateString('fa-IR')}</td>
                    <td>{r.operator?.name || r.operator?.phone || `#${r.operatorId}`}</td>
                    <td>{r.seq}</td>
                    <td>{hhmm(r.callTime)}</td>
                    <td style={{ minWidth: 260 }}>{r.subjectText}</td>
                    <td>{r.callerPhone}</td>
                    <td style={{ minWidth: 260 }}>{r.resultText || ''}</td>
                    <td>{r.finalStatus === 'FINAL' ? 'قطعی' : '—'}</td>
                    <td>{r.finalizedAt ? hhmm(r.finalizedAt) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {total > 0 ? `نمایش ${pageFrom} تا ${pageTo} از ${total.toLocaleString('fa-IR')}` : ''}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-ghost" disabled={!canPrev || loadingList} onClick={() => setSkip(Math.max(0, skip - take))}>
              قبلی
            </button>
            <button type="button" className="btn btn-ghost" disabled={!canNext || loadingList} onClick={() => setSkip(skip + take)}>
              بعدی
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}