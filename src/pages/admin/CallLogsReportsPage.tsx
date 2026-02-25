import { useEffect, useMemo, useState } from 'react';
import client from '../../api/client';
import { toast } from 'react-toastify';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, subMonths, subYears, eachDayOfInterval, parseISO } from 'date-fns';

const rangePresets = {
  '7d': { label: '۷ روز گذشته', start: () => subDays(new Date(), 6) },
  '30d': { label: '۳۰ روز گذشته', start: () => subDays(new Date(), 29) },
  '3m': { label: '۳ ماه گذشته', start: () => subMonths(new Date(), 3) },
  '1y': { label: '۱ سال گذشته', start: () => subYears(new Date(), 1) },
  all: { label: 'کل', start: () => new Date(0) },
};

type DailyItem = { date: string; count: number };
type DailyReport = {
  from: string;
  to: string;
  total: number;
  items: DailyItem[];
};

function safeParseDate(val?: string) {
  try {
    if (!val) return undefined;
    return parseISO(val);
  } catch {
    return undefined;
  }
}

function normalizeToSeries(items: DailyItem[], startDate: Date, endDate: Date) {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const map = new Map<string, number>();
  days.forEach((d) => map.set(format(d, 'yyyy-MM-dd'), 0));
  items.forEach((it) => {
    const d = safeParseDate(it.date);
    if (!d) return;
    const key = format(d, 'yyyy-MM-dd');
    if (map.has(key)) map.set(key, it.count);
  });
  return Array.from(map.entries()).map(([date, count]) => ({
    date,
    display: format(new Date(date), 'MM/dd'),
    count,
  }));
}

export default function CallLogsReportsPage() {
  const SERVICE_ID = 1; 

  const [rangeKey, setRangeKey] = useState<keyof typeof rangePresets>('7d');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DailyReport | null>(null);

  const range = rangePresets[rangeKey];
  const startDate = range.start();
  const endDate = new Date();

  async function load() {
    try {
      setLoading(true);

      const r = await client.get<DailyReport>('/admin/call-logs/reports/daily', {
        params: { range: rangeKey, serviceId: SERVICE_ID },
      });

      setReport(r.data);
    } catch (e: unknown) {
      console.error(e);
      const message =
        typeof e === 'object' &&
        e !== null &&
        'response' in e &&
        (e as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'خطا در دریافت گزارش تماس‌ها';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  const series = useMemo(() => {
    const items = report?.items ?? [];
    return normalizeToSeries(items, startDate, endDate);
  }, [report, startDate, endDate]);

  const totalInRange = useMemo(() => series.reduce((s, it) => s + it.count, 0), [series]);

  const canRenderChart = !loading && series.length > 0;

  return (
    <div className="bp-page-aurora-2025">
      <div className="bp-surface-aurora-2025" style={{ padding: 16, borderRadius: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0 }}>گزارش تماس‌ها</h3>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              نمودار تعداد تماس‌های دریافتی به تفکیک روز (سرویس #{SERVICE_ID})
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.keys(rangePresets).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setRangeKey(k as keyof typeof rangePresets)}
                className={`px-3 py-1 rounded ${k === rangeKey ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {rangePresets[k as keyof typeof rangePresets].label}
              </button>
            ))}
            <button type="button" className="btn btn-ghost" onClick={load}>
              بروزرسانی
            </button>
          </div>
        </div>
      </div>

      <div className="bp-surface-aurora-2025" style={{ padding: 16, borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>نمودار تماس‌های ثبت شده</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>کل در بازه: {totalInRange}</div>
          </div>
          {report?.from && report?.to && (
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              بازه: {report.from} تا {report.to}
            </div>
          )}
        </div>

        <div style={{ width: '100%', height: 280, minHeight: 220, marginTop: 12 }} className="chart-wrapper">
          {canRenderChart ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="display" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              {loading ? 'در حال بارگذاری...' : 'داده‌ای برای نمایش وجود ندارد.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}