import { useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format, subDays, subMonths, subYears, eachDayOfInterval, parseISO } from 'date-fns';

const rangePresets = {
  '7d': { label: '۷ روز گذشته', start: () => subDays(new Date(), 6) },
  '30d': { label: '۳۰ روز گذشته', start: () => subDays(new Date(), 29) },
  '3m': { label: '۳ ماه گذشته', start: () => subMonths(new Date(), 3) },
  '1y': { label: '۱ سال گذشته', start: () => subYears(new Date(), 1) },
  all: { label: 'کل', start: () => new Date(0) },
};

const COLORS = ['#10b981', '#ef4444', '#6366f1', '#f59e0b', '#06b6d4', '#db2777'];



const ColoredBox: React.FC<{ title: string; value: number | string; colorClass: string }> = ({ title, value, colorClass }) => (
  <div className={`colored-box-3d ${colorClass}`}>
    <div className="title">{title}</div>
    <div className="value">{value}</div>
  </div>
);

function asArray(possible: any) {
  if (!possible) return [];
  if (Array.isArray(possible)) return possible;
  // Common paginated shapes: { data: [...] } or { users: [...] } or { items: [...] }
  if (Array.isArray(possible.data)) return possible.data;
  if (Array.isArray(possible.users)) return possible.users;
  if (Array.isArray(possible.items)) return possible.items;
  // fallback: try to find first array property
  const vals = Object.values(possible).find((v) => Array.isArray(v));
  return vals || [];
}

function safeParseDate(val?: string) {
  try {
    if (!val) return undefined;
    return parseISO(val);
  } catch {
    return undefined;
  }
}

function groupByDate(items: any[], dateKey: string, startDate: Date, endDate: Date) {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const map = new Map<string, number>();
  days.forEach((d) => map.set(format(d, 'yyyy-MM-dd'), 0));
  items.forEach((it) => {
    const raw = it[dateKey];
    const parsed = safeParseDate(raw);
    if (!parsed) return;
    const key = format(parsed, 'yyyy-MM-dd');
    if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries()).map(([date, count]) => ({ date, display: format(new Date(date), 'MM/dd'), count }));
}

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [rangeKey, setRangeKey] = useState<keyof typeof rangePresets>('7d');

  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true);
        const [ro, ru, rb, rm, rp] = await Promise.all([
          client.get('/admin/orders'),
          client.get('/admin/users'),
          client.get('/admin/brands'),
          client.get('/admin/models'),
          client.get('/admin/problems'),
        ]);
        setOrders(asArray(ro.data));
        setUsers(asArray(ru.data));
        setBrands(asArray(rb.data));
        setModels(asArray(rm.data));
        setProblems(asArray(rp.data));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const range = rangePresets[rangeKey];
  const startDate = range.start();
  const endDate = new Date();

  // Top 8 colored boxes counts
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const usersToday = users.filter((u) => {
    const d = safeParseDate(u.createdAt);
    return d ? format(d, 'yyyy-MM-dd') === todayStr : false;
  }).length;
  const ordersToday = orders.filter((o) => {
    const d = safeParseDate(o.createdAt);
    return d ? format(d, 'yyyy-MM-dd') === todayStr : false;
  }).length;
  const ordersPriceSet = orders.filter((o) => o.orderStage === 'PRICE_SET').length;
  const ordersTechnicianAssigned = orders.filter((o) => o.orderStage === 'TECHNICIAN_ASSIGNED').length;
  const ordersInRepair = orders.filter((o) => o.orderStage === 'IN_REPAIR').length;
  const ordersReadyForPickup = orders.filter((o) => o.orderStage === 'READY_FOR_PICKUP').length;
  const ordersCompletedToday = orders.filter((o) => {
    const d = safeParseDate(o.updatedAt || o.createdAt);
    return d ? format(d, 'yyyy-MM-dd') === todayStr && o.orderStage === 'COMPLETED' : false;
  }).length;
  const ordersNotRepairableToday = orders.filter((o) => {
    const d = safeParseDate(o.updatedAt || o.createdAt);
    return d ? format(d, 'yyyy-MM-dd') === todayStr && o.status === 'NOT_REPAIRABLE' : false;
  }).length;

  // Time series
  const registeredSeries = useMemo(() => groupByDate(orders, 'createdAt', startDate, endDate), [orders, startDate, endDate]);
  const completedSeries = useMemo(() => groupByDate(orders.filter((o) => o.orderStage === 'COMPLETED'), 'updatedAt', startDate, endDate), [orders, startDate, endDate]);
  const notRepairableSeries = useMemo(() => groupByDate(orders.filter((o) => o.status === 'NOT_REPAIRABLE'), 'updatedAt', startDate, endDate), [orders, startDate, endDate]);
  const usersSeries = useMemo(() => groupByDate(users, 'createdAt', startDate, endDate), [users, startDate, endDate]);

  const totalRegisteredInRange = registeredSeries.reduce((s, it) => s + it.count, 0);
  const totalCompletedInRange = completedSeries.reduce((s, it) => s + it.count, 0);
  const totalNotRepairableInRange = notRepairableSeries.reduce((s, it) => s + it.count, 0);
  const totalUsersInRange = usersSeries.reduce((s, it) => s + it.count, 0);

  const pieData = [
    { name: 'تکمیل شده', value: totalCompletedInRange },
    { name: 'عدم تعمیر', value: totalNotRepairableInRange },
  ];

  // helper to safely render charts only when container can calculate size
  const canRenderCharts = !loading && (registeredSeries.length > 0 || usersSeries.length > 0 || completedSeries.length > 0 || notRepairableSeries.length > 0);

  return (
    <div className="bartar-dashboard-root">
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">پیشخوان</h2>
        <div className="text-sm text-gray-500">آخرین بروزرسانی: {new Date().toLocaleString()}</div>
      </div>

      {/* 8 colored boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ColoredBox title="کاربران ثبت نام کرده امروز" value={usersToday} colorClass="bg-gradient-to-br from-green-500 to-teal-400" />
        <ColoredBox title="سفارشات ثبت شده امروز" value={ordersToday} colorClass="bg-gradient-to-br from-indigo-500 to-purple-500" />
        <ColoredBox title="سفارشات تعیین قیمت" value={ordersPriceSet} colorClass="bg-gradient-to-br from-yellow-500 to-orange-500" />
        <ColoredBox title="سفارشات تخصیص تکنسین" value={ordersTechnicianAssigned} colorClass="bg-gradient-to-br from-pink-500 to-rose-500" />
        <ColoredBox title="سفارشات در حال تعمیر" value={ordersInRepair} colorClass="bg-gradient-to-br from-sky-500 to-cyan-500" />
        <ColoredBox title="سفارشات آماده تحویل" value={ordersReadyForPickup} colorClass="bg-gradient-to-br from-lime-500 to-emerald-500" />
        <ColoredBox title="سفارشات تکمیل شده امروز" value={ordersCompletedToday} colorClass="bg-gradient-to-br from-violet-500 to-indigo-600" />
        <ColoredBox title="سفارشات عدم تعمیر امروز" value={ordersNotRepairableToday} colorClass="bg-gradient-to-br from-red-600 to-rose-600" />
      </div>

      {/* Line charts + Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-500">نمودار سفارشات ثبت شده</div>
              <div className="text-xs text-gray-600">کل در بازه: {totalRegisteredInRange}</div>
            </div>
            <div className="flex gap-2">
              {Object.keys(rangePresets).map((k) => (
                <button key={k} onClick={() => setRangeKey(k as any)} className={`px-3 py-1 rounded ${k === rangeKey ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  {rangePresets[k as keyof typeof rangePresets].label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', height: 260, minHeight: 200 }} className="chart-wrapper">
            {canRenderCharts ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={registeredSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="display" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-gray-400">در حال آماده‌سازی نمودار...</div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-500">نمودار سفارشات تکمیل شده</div>
              <div className="text-xs text-gray-600">کل در بازه: {totalCompletedInRange}</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 260, minHeight: 200 }} className="chart-wrapper">
            {canRenderCharts ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={completedSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="display" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-gray-400">در حال آماده‌سازی نمودار...</div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-500">نمودار سفارشات عدم تعمیر</div>
              <div className="text-xs text-gray-600">کل در بازه: {totalNotRepairableInRange}</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 260, minHeight: 200 }} className="chart-wrapper">
            {canRenderCharts ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={notRepairableSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="display" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={3} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-gray-400">در حال آماده‌سازی نمودار...</div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-500">نمودار کاربران ثبت‌نامی</div>
              <div className="text-xs text-gray-600">کل در بازه: {totalUsersInRange}</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 260, minHeight: 200 }} className="chart-wrapper">
            {canRenderCharts ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usersSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="display" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={3} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-gray-400">در حال آماده‌سازی نمودار...</div>
            )}
          </div>
        </div>
      </div>

      {/* Pie chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow-sm">
          <div className="text-sm text-gray-500 mb-2">نسبت سفارشات تکمیل شده / عدم تعمیر</div>
          <div style={{ width: '100%', height: 260, minHeight: 200 }} className="flex items-center justify-center">
            {canRenderCharts ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} label>
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-gray-400">در حال آماده‌سازی نمودار...</div>
            )}
          </div>
        </div>

        {/* three colored small boxes */}
        <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="small-box-3d bg-gradient-to-br from-indigo-500 to-blue-500">
            <div className="text-sm opacity-90">تعداد برند ثبت شده</div>
            <div className="text-2xl font-extrabold mt-2">{brands.length}</div>
          </div>
          <div className="rounded-lg p-4 bg-gradient-to-br from-emerald-500 to-lime-500 text-white">
            <div className="text-sm opacity-90">تعداد مدل ثبت شده</div>
            <div className="text-2xl font-extrabold mt-2">{models.length}</div>
          </div>
          <div className="rounded-lg p-4 bg-gradient-to-br from-rose-500 to-pink-500 text-white">
            <div className="text-sm opacity-90">تعداد مشکلات ثبت شده</div>
            <div className="text-2xl font-extrabold mt-2">{problems.length}</div>
          </div>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">در حال بارگذاری...</div>}
    </div>
    </div>
  );
}
