import { useEffect, useState } from 'react';
import client from '../../api/client';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { Edit, Trash2, Plus, Search } from 'lucide-react';

type ServiceOpt = { value: number; label: string };

type Part = {
  id: number;
  name: string;
  code?: string | null;
  serviceId: number;
  active: boolean;
  createdAt: string;
  service?: { id: number; name: string };
};

type PartsFilter = {
  serviceId?: number;
  q?: string;
};

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [services, setServices] = useState<ServiceOpt[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<PartsFilter>({});
  const [editing, setEditing] = useState<Part | null>(null);

  const { register, handleSubmit, control, reset, watch } = useForm({
    defaultValues: {
      name: '',
      code: '',
      serviceId: undefined as any,
      active: true,
    },
  });

  // فیلترها
  const [searchText, setSearchText] = useState('');
  const [filterServiceId, setFilterServiceId] = useState<number | undefined>(undefined);

  async function load() {
    setLoading(true);
    try {
      const [rs, rp] = await Promise.all([
        client.get('/admin/services'),
        client.get('/admin/parts', {
          params: {
            serviceId: filter.serviceId,
            q: filter.q,
          },
        }),
      ]);

      setServices((rs.data || []).map((s: any) => ({ value: s.id, label: s.name })));
      setParts(rp.data || []);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'خطا در دریافت قطعات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.serviceId, filter.q]);

  function openCreate() {
    setEditing(null);
    reset({
      name: '',
      code: '',
      serviceId: undefined as any,
      active: true,
    });
    (document.getElementById('part-modal') as HTMLDialogElement)?.showModal?.();
  }

  function openEdit(part: Part) {
    setEditing(part);
    reset({
      name: part.name,
      code: part.code ?? '',
      serviceId: part.serviceId,
      active: part.active,
    });
    (document.getElementById('part-modal') as HTMLDialogElement)?.showModal?.();
  }

  async function onSubmit(data: any) {
    try {
      const payload = {
        name: data.name,
        code: data.code || undefined,
        serviceId: data.serviceId?.value ?? data.serviceId,
        active: data.active,
      };

      if (!payload.serviceId) {
        toast.error('انتخاب سرویس اجباری است');
        return;
      }

      if (editing) {
        await client.put(`/admin/parts/${editing.id}`, payload);
        toast.success('قطعه ویرایش شد');
      } else {
        await client.post('/admin/parts', payload);
        toast.success('قطعه ایجاد شد');
      }

      (document.getElementById('part-modal') as HTMLDialogElement)?.close?.();
      load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'خطا در ذخیره قطعه');
    }
  }

  async function remove(id: number) {
    if (!confirm('از حذف این قطعه مطمئن هستید؟')) return;
    try {
      await client.delete(`/admin/parts/${id}`);
      toast.success('قطعه حذف شد');
      load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'خطا در حذف قطعه');
    }
  }

  function applyFilter() {
    setFilter({
      serviceId: filterServiceId,
      q: searchText.trim() || undefined,
    });
  }

  function clearFilter() {
    setFilter({});
    setSearchText('');
    setFilterServiceId(undefined);
  }

  const activeValue = watch('active');

  return (
    <div className="parts-panel bp-page-aurora-2025">
      {/* Header */}
      <div className="parts-header">
        <div>
          <h3 className="parts-title">مدیریت قطعات</h3>
          <p className="parts-subtitle">
            ایجاد، ویرایش و مدیریت قطعات مرتبط با هر سرویس (مثل LCD موبایل، باتری لپ‌تاپ و ...)
          </p>
        </div>

        <div className="parts-header-actions">
          <button className="btn btn-secondary" onClick={openCreate}>
            <Plus className="icon" />
            <span>ایجاد قطعه جدید</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="parts-filter-card">
        <div className="parts-filter-row">
          <div className="parts-filter-col">
            <label className="parts-filter-label">فیلتر بر اساس سرویس</label>
            <Select
              isClearable
              options={services}
              value={filterServiceId ? services.find(s => s.value === filterServiceId) || null : null}
              onChange={(opt) => setFilterServiceId(opt?.value)}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="همه سرویس‌ها"
            />
          </div>

          <div className="parts-filter-col">
            <label className="parts-filter-label">جستجوی نام / کد قطعه</label>
            <div className="parts-search-input-wrapper">
              <Search className="icon search-icon" />
              <input
                className="parts-search-input"
                placeholder="مثلاً LCD یا BATT-01 ..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
              />
            </div>
          </div>

          <div className="parts-filter-actions">
            <button className="btn btn-ghost" onClick={clearFilter}>حذف فیلترها</button>
            <button className="btn btn-primary" onClick={applyFilter}>اعمال فیلتر</button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="parts-list-wrapper">
        {loading ? (
          <div className="parts-loading">در حال دریافت اطلاعات...</div>
        ) : parts.length === 0 ? (
          <div className="parts-empty-state">
            <p>هنوز هیچ قطعه‌ای ثبت نشده است.</p>
            <button className="btn btn-secondary" onClick={openCreate}>اولین قطعه را اضافه کنید</button>
          </div>
        ) : (
          <div className="parts-grid">
            {parts.map((p) => (
              <div key={p.id} className="part-card">
                <div className="part-card-main">
                  <div className="part-card-avatar">
                    {p.name?.[0]?.toUpperCase() || 'P'}
                  </div>
                  <div className="part-card-info">
                    <div className="part-card-name">
                      {p.name}
                      {!p.active && <span className="part-badge part-badge-muted">غیرفعال</span>}
                    </div>
                    <div className="part-card-meta">
                      <span className="part-meta-item">
                        سرویس: {p.service?.name || `#${p.serviceId}`}
                      </span>
                      {p.code && (
                        <span className="part-meta-item">
                          کد: <code>{p.code}</code>
                        </span>
                      )}
                    </div>
                    <div className="part-card-date">
                      ثبت در: {new Date(p.createdAt).toLocaleString('fa-IR')}
                    </div>
                  </div>
                </div>

                <div className="part-card-actions">
                  <button className="icon-btn edit" onClick={() => openEdit(p)} title="ویرایش">
                    <Edit className="icon" />
                  </button>
                  <button className="icon-btn remove" onClick={() => remove(p.id)} title="حذف">
                    <Trash2 className="icon" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <dialog id="part-modal" className="part-modal">
        <form className="part-form" onSubmit={handleSubmit(onSubmit)} method="dialog">
          <div className="part-form-header">
            <h4>{editing ? 'ویرایش قطعه' : 'ایجاد قطعه جدید'}</h4>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => (document.getElementById('part-modal') as HTMLDialogElement).close()}
            >
              بستن
            </button>
          </div>

          <div className="part-form-body">
            <div className="form-row">
              <label>نام قطعه</label>
              <input
                {...register('name', { required: true })}
                placeholder="مثلاً LCD، باتری، مادربرد..."
                className="form-input"
              />
            </div>

            <div className="form-row">
              <label>کد قطعه (اختیاری)</label>
              <input
                {...register('code')}
                placeholder="مثلاً LCD-IP12-BLACK"
                className="form-input"
              />
            </div>

            <div className="form-row">
              <label>سرویس مرتبط</label>
              <Controller
                control={control}
                name="serviceId"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    options={services}
                    value={
                      services.find((s) => s.value === (field.value?.value ?? field.value)) || null
                    }
                    onChange={(opt) => field.onChange(opt)}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="سرویس را انتخاب کنید..."
                  />
                )}
              />
            </div>

            <div className="form-row form-row-inline">
              <label>وضعیت</label>
              <label className="switch">
                <input
                  type="checkbox"
                  {...register('active')}
                  checked={!!activeValue}
                  onChange={(e) => {
                    // react-hook-form کنترلش کند
                    (register('active').onChange as any)(e);
                  }}
                />
                <span className="slider" />
              </label>
              <span className="switch-label">
                {activeValue ? 'فعال' : 'غیرفعال'}
              </span>
            </div>
          </div>

          <div className="part-form-footer">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => (document.getElementById('part-modal') as HTMLDialogElement).close()}
            >
              انصراف
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? 'ذخیره تغییرات' : 'ایجاد قطعه'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
