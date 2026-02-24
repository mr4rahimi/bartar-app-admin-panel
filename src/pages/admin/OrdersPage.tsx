// D:\projects\bartar-app\admin-panel\src\pages\admin\OrdersPage.tsx
import { useEffect, useState } from 'react';
import client from '../../api/client';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Loader2, Info } from 'lucide-react';

interface Order {
  id: number;
  orderNumber: string;
  user: { name?: string; phone: string };
  service?: { name: string };
  issue: string;
  basePrice?: number;
  finalPrice?: number;
  status: string;
  orderStage: string;
  createdAt: string;
  notes?: string;
  deviceType?: string;
  brand?: string;
  model?: string;
  pickupMethod?: string;
  finalPriceConfirmed?: boolean;

  technicianId?: number | null;
  technician?: {
    id: number;
    name?: string | null;
    phone: string;
  };
}

interface TechnicianOption {
  id: number;
  name: string;
  phone: string;
}

const stageOptions = [
  { value: 'REGISTERED', label: 'ثبت سفارش' },
  { value: 'PRICE_SET', label: 'تعیین قیمت' },
  { value: 'TECHNICIAN_ASSIGNED', label: 'تخصیص تکنسین' },
  { value: 'IN_REPAIR', label: 'در حال تعمیر' },
  { value: 'READY_FOR_PICKUP', label: 'آماده تحویل' },
  { value: 'COMPLETED', label: 'تکمیل شده' },
];

const statusLabels: Record<string, string> = {
  PENDING: 'در انتظار بررسی',
  CONFIRMED: 'تأیید شده',
  IN_PROGRESS: 'در حال انجام',
  COMPLETED: 'تکمیل شده',
  NOT_REPAIRABLE: 'عدم تعمیر',
  CANCELLED: 'لغو شده',
};

type DraftOrder = Partial<
  Pick<Order, 'basePrice' | 'finalPrice' | 'orderStage' | 'status' | 'technicianId'>
>;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [drafts, setDrafts] = useState<Record<number, DraftOrder>>({});

  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);

  const setDraft = (orderId: number, patch: DraftOrder) =>
    setDrafts((prev) => ({ ...prev, [orderId]: { ...prev[orderId], ...patch } }));

  async function loadOrders() {
    try {
      const res = await client.get('/admin/orders');
      setOrders(res.data);
      setDrafts({});
    } catch {
      toast.error('خطا در دریافت لیست سفارش‌ها');
    } finally {
      setLoading(false);
    }
  }

  async function loadTechnicians() {
    try {
      const res = await client.get('/admin/technicians');
      const data = res.data as any[];

      const mapped: TechnicianOption[] = data.map((t) => ({
        id: t.id,
        name: t.name || t.phone || `تکنسین ${t.id}`,
        phone: t.phone,
      }));

      setTechnicians(mapped);
    } catch {
      toast.error('خطا در دریافت لیست تکنسین‌ها');
    }
  }

  useEffect(() => {
    loadOrders();
    loadTechnicians();
  }, []);

  const hasDraft = (order: Order) =>
    Boolean(drafts[order.id] && Object.keys(drafts[order.id]).length > 0);

  const formatDate = (value: string) => {
    const date = new Date(value);
    return date.toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' });
  };

  async function handleSave(orderId: number) {
    const draft = drafts[orderId];
    if (!draft || Object.keys(draft).length === 0) return;
    try {
      setSavingId(orderId);
      await client.patch(`/admin/orders/${orderId}`, draft);
      toast.success('سفارش با موفقیت ذخیره شد');
      loadOrders();
    } catch {
      toast.error('ذخیره سفارش ناموفق بود');
    } finally {
      setSavingId(null);
    }
  }

  async function handleAssignTechnician(orderId: number) {
    const draft = drafts[orderId];
    const technicianId = draft?.technicianId;

    if (!technicianId) {
      toast.error('لطفاً ابتدا تکنسین را انتخاب کنید');
      return;
    }

    try {
      setSavingId(orderId);
      await client.post(`/admin/orders/${orderId}/assign-technician`, { technicianId });
      toast.success('تخصیص تکنسین با موفقیت انجام شد');
      loadOrders();
    } catch {
      toast.error('خطا در تخصیص تکنسین');
    } finally {
      setSavingId(null);
    }
  }

  const markNotRepairable = (orderId: number) => {
    setDraft(orderId, { status: 'NOT_REPAIRABLE', orderStage: 'COMPLETED' });
  };

  if (loading) {
    return (
      <div className="orders-loading">
        <Loader2 className="orders-loader" />
      </div>
    );
  }

  return (
    <div className="orders-panel bp-page-aurora-2025">
      <Card className="bp-surface-aurora-2025">
        <CardHeader>
          <div className="orders-header">
            <CardTitle>مدیریت سفارش‌ها</CardTitle>
            <div className="orders-actions">
              <Input placeholder="جستجو شماره سفارش یا موبایل..." className="orders-search" />
              <Button className="orders-filter-btn">فیلترها</Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <colgroup>
                <col style={{ width: '12.5%' }} />
                <col style={{ width: '12.5%' }} />
                <col style={{ width: '12.5%' }} />
                <col style={{ width: '12.5%' }} />
                <col style={{ width: '12.5%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '12.5%' }} />
              </colgroup>

              <thead className="orders-thead">
                <tr>
                  <th className="orders-th text-left">کد سفارش</th>
                  <th className="orders-th">مشتری</th>
                  <th className="orders-th">خدمت</th>
                  <th className="orders-th">مشکل</th>
                  <th className="orders-th">قیمت‌ها</th>
                  <th className="orders-th">مرحله تعمیر</th>
                  <th className="orders-th">اقدامات</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order, i) => {
                  const draft = drafts[order.id] || {};
                  const baseValue = draft.basePrice ?? order.basePrice ?? '';
                  const finalValue = draft.finalPrice ?? order.finalPrice ?? '';

                  const currentStage = draft.orderStage ?? order.orderStage;
                  const selectedTechnicianId =
                    draft.technicianId ?? order.technician?.id ?? undefined;

                  return (
                    <tr
                      key={order.id}
                      className={`orders-tr ${i % 2 === 0 ? 'even' : 'odd'}`}
                    >
                      {/* کد سفارش */}
                      <td className="orders-td">
                        <div className="orders-cell-left">{order.orderNumber}</div>
                      </td>

                      {/* مشتری (دو ردیف) */}
                      <td className="orders-td">
                        <div className="orders-cell">
                          <div className="orders-cell-title">{order.user?.name || 'بدون نام'}</div>
                          <div className="orders-cell-sub">{order.user?.phone}</div>
                        </div>
                      </td>

                      {/* خدمت (دو ردیف آماده) */}
                      <td className="orders-td">
                        <div className="orders-cell">
                          <div className="orders-cell-title">{order.service?.name || '-'}</div>
                        </div>
                      </td>

                      {/* مشکل (دو ردیف فونت کوچکتر) */}
                      <td className="orders-td">
                        <div className="orders-cell">
                          <div className="orders-cell-title small">{order.issue}</div>
                        </div>
                      </td>

                      {/* قیمت‌ها */}
                      <td className="orders-td">
                        <div className="orders-price-col">
                          <Input
                            type="number"
                            placeholder="قیمت پایه"
                            value={baseValue as any}
                            onChange={(e) =>
                              setDraft(order.id, { basePrice: e.target.value ? Number(e.target.value) : undefined })
                            }
                            className="price-input price-input-base"
                          />
                          <Input
                            type="number"
                            placeholder="قیمت نهایی"
                            value={finalValue as any}
                            onChange={(e) =>
                              setDraft(order.id, { finalPrice: e.target.value ? Number(e.target.value) : undefined })
                            }
                            className="price-input price-input-final"
                          />

                          {order.finalPrice !== null && order.finalPrice !== undefined && (
                            <div className="price-flag">
                              <span className={order.finalPriceConfirmed ? 'flag-confirmed' : 'flag-pending'}>
                                {order.finalPriceConfirmed ? 'تایید شده توسط کاربر' : 'در انتظار تایید کاربر'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* مرحله تعمیر */}
                      <td className="orders-td">
                        <div className="orders-stage-col">
                          <div className="orders-select-wrap">
                            <Select
                              className="orders-select"
                              value={currentStage}
                              onValueChange={(val) => setDraft(order.id, { orderStage: val })}
                            >
                              <SelectTrigger className="select-trigger">
                                <SelectValue placeholder="انتخاب مرحله" />
                              </SelectTrigger>
                              <SelectContent className="select-content">
                                {stageOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value} className="select-item">
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="mt-8 actions-row">
                            <Button className="btn-not-repairable" onClick={() => markNotRepairable(order.id)}>
                              اعلام عدم تعمیر
                            </Button>
                          </div>

                          {currentStage === 'TECHNICIAN_ASSIGNED' && (
                            <div className="assign-block">
                              <div className="assign-label">تکنسین مسئول</div>

                              <Select
                                className="orders-select"
                                value={selectedTechnicianId ? String(selectedTechnicianId) : undefined}
                                onValueChange={(val) =>
                                  setDraft(order.id, { technicianId: val ? Number(val) : undefined })
                                }
                              >
                                <SelectTrigger className="select-trigger">
                                  <SelectValue
                                    placeholder={order.technician ? order.technician.name || order.technician.phone : 'انتخاب تکنسین'}
                                  />
                                </SelectTrigger>
                                <SelectContent className="select-content select-content-large">
                                  {technicians.map((t) => (
                                    <SelectItem key={t.id} value={String(t.id)} className="select-item">
                                      {t.name} ({t.phone})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Button
                                className="btn-assign"
                                disabled={savingId === order.id}
                                onClick={() => handleAssignTechnician(order.id)}
                              >
                                {savingId === order.id ? <Loader2 className="loader-small" /> : 'تخصیص تکنسین'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* اقدامات */}
                      <td className="orders-td">
                        <div className="actions-col">
                          <Button
                            disabled={!hasDraft(order) || savingId === order.id}
                            className={`btn-save ${!hasDraft(order) || savingId === order.id ? 'disabled' : ''}`}
                            onClick={() => handleSave(order.id)}
                          >
                            {savingId === order.id ? <Loader2 className="loader-small white" /> : 'ذخیره'}
                          </Button>

                          <Button className="btn-details" onClick={() => setDetailOrder(order)}>
                            <Info className="info-icon" />
                            جزئیات
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal details */}
      {detailOrder && (
        <div className="orders-modal">
          <div className="orders-modal-card">
            <div className="orders-modal-header">
              <div>
                <h3 className="orders-modal-title">جزئیات سفارش {detailOrder.orderNumber}</h3>
                <div className="orders-modal-sub">{formatDate(detailOrder.createdAt)}</div>
              </div>
              <Button className="modal-close" onClick={() => setDetailOrder(null)}>بستن</Button>
            </div>

            <div className="orders-modal-body">
              <div className="modal-col">
                <p><strong>نام مشتری:</strong> {detailOrder.user?.name || 'ثبت نشده'}</p>
                <p><strong>شماره تماس:</strong> {detailOrder.user?.phone}</p>
                <p><strong>خدمت / دستگاه:</strong> {detailOrder.service?.name || detailOrder.deviceType || '-'}</p>
                <p><strong>برند / مدل:</strong> {(detailOrder.brand || '-') + ' ' + (detailOrder.model || '')}</p>
                <p><strong>روش دریافت:</strong> {detailOrder.pickupMethod || '-'}</p>
              </div>

              <div className="modal-col">
                <p><strong>مشکل اعلام‌شده:</strong> {detailOrder.issue}</p>
                <p><strong>توضیحات:</strong> {detailOrder.notes || 'وجود ندارد'}</p>
                <p><strong>قیمت پایه:</strong> {detailOrder.basePrice ? `${detailOrder.basePrice} تومان` : '-'}</p>
                <p><strong>قیمت نهایی:</strong> {detailOrder.finalPrice ? `${detailOrder.finalPrice} تومان` : '-'}</p>
                <p><strong>مرحله فعلی:</strong> {stageOptions.find((s) => s.value === detailOrder.orderStage)?.label || detailOrder.orderStage}</p>
                <p><strong>وضعیت کلی:</strong> {statusLabels[detailOrder.status] || detailOrder.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
