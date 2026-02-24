// D:\projects\bartar-app\admin-panel\src\pages\admin\BrandsPage.tsx
import { useEffect, useState } from 'react';
import client from '../../api/client';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { Edit, Trash2 } from 'lucide-react';

type ServiceOpt = { value: number; label: string };
type Brand = { id: number; name: string; slug: string; services?: any[]; iconUrl?: string };

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [services, setServices] = useState<ServiceOpt[]>([]);
  const [editing, setEditing] = useState<Brand | null>(null);
  const { register, control, handleSubmit, reset } = useForm();

  async function load() {
    try {
      const [rb, rs] = await Promise.all([client.get('/admin/brands'), client.get('/admin/services')]);
      setBrands(rb.data || []);
      setServices((rs.data || []).map((s: any) => ({ value: s.id, label: s.name })));
    } catch {
      toast.error('خطا در دریافت داده‌ها');
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    reset({ name: '', slug: '', iconUrl: '', description: '', serviceIds: [] });
    (document.getElementById('brand-modal') as HTMLDialogElement)?.showModal?.();
  }

  function openEdit(b: Brand) {
    setEditing(b);
    reset({ ...b, serviceIds: (b.services || []).map((x: any) => x.service.id) });
    (document.getElementById('brand-modal') as HTMLDialogElement)?.showModal?.();
  }

  async function onSubmit(data: any) {
    try {
      const payload = { ...data, serviceIds: (data.serviceIds || []).map((v: any) => v.value ?? v) };
      if (editing) {
        await client.put(`/admin/brands/${editing.id}`, payload);
        toast.success('برند ویرایش شد');
      } else {
        await client.post(`/admin/brands`, payload);
        toast.success('برند ایجاد شد');
      }
      (document.getElementById('brand-modal') as HTMLDialogElement)?.close?.();
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'خطا');
    }
  }

  async function remove(id: number) {
    if (!confirm('مطمئن هستید؟')) return;
    try {
      await client.delete(`/admin/brands/${id}`);
      toast.success('حذف شد');
      load();
    } catch {
      toast.error('خطا در حذف');
    }
  }

  return (
    <div className="brands-panel bp-page-aurora-2025">
      <div className="brands-header bp-surface-aurora-2025">
        <div>
          <h3 className="brands-title">برندها</h3>
          <p className="brands-sub">مدیریت، ایجاد و ویرایش برندها</p>
        </div>

        <div className="brands-controls">
          <button className="btn btn-secondary" onClick={openCreate}>ایجاد برند</button>
        </div>
      </div>

      <div className="brands-list bp-surface-aurora-2025">
        {brands.length === 0 ? (
          <div className="brands-empty">برندی یافت نشد</div>
        ) : (
          brands.map(b => (
            <div key={b.id} className="brand-card">
              <div className="brand-left">
                <div className="brand-avatar">
                  {b.iconUrl ? <img src={b.iconUrl} alt={b.name} /> : <div className="brand-placeholder">{b.name?.[0] ?? 'B'}</div>}
                </div>
                <div className="brand-meta">
                  <div className="brand-name">{b.name}</div>
                  <div className="brand-slug">{b.slug}</div>
                  <div className="brand-services">خدمات: {(b.services || []).map((s:any) => s.service.name).join(' ، ') || '-'}</div>
                </div>
              </div>

              <div className="brand-actions">
                <button className="icon-btn edit" onClick={() => openEdit(b)} title="ویرایش">
                  <Edit className="icon" />
                </button>
                <button className="icon-btn remove" onClick={() => remove(b.id)} title="حذف">
                  <Trash2 className="icon" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* modal */}
      <dialog id="brand-modal" className="brand-modal bp-modal-aurora-2025">
        <form className="brand-form bp-surface-aurora-2025" onSubmit={handleSubmit(onSubmit)}>
          <div className="brand-form-header">
            <h4>{editing ? 'ویرایش برند' : 'ایجاد برند'}</h4>
            <div className="brand-form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => (document.getElementById('brand-modal') as HTMLDialogElement).close()}>انصراف</button>
            </div>
          </div>

          <div className="brand-form-body">
            <div className="form-row">
              <label>نام برند</label>
              <input {...register('name', { required: true })} placeholder="نام برند" className="form-input" />
            </div>

            <div className="form-row">
              <label>slug</label>
              <input {...register('slug')} placeholder="slug" className="form-input" />
            </div>

            <div className="form-row">
              <label>آدرس آیکن (URL)</label>
              <input {...register('iconUrl')} placeholder="https://..." className="form-input" />
            </div>

            <div className="form-row">
              <label>توضیحات</label>
              <textarea {...register('description')} placeholder="توضیحات برند" className="form-textarea" />
            </div>

            <div className="form-row">
              <label>انتخاب خدمات مرتبط</label>
              <Controller
                control={control}
                name="serviceIds"
                render={({ field }) => (
                  <Select
                    isMulti
                    options={services}
                    value={(field.value || []).map((v: any) => services.find(s => s.value === (v.value ?? v)))}
                    onChange={(v) => field.onChange(v)}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="خدمات را انتخاب کنید..."
                    menuPlacement="auto"
                  />
                )}
              />
            </div>

            <div className="form-row form-row-actions">
              <button type="button" onClick={() => (document.getElementById('brand-modal') as HTMLDialogElement).close()} className="btn btn-ghost">انصراف</button>
              <button type="submit" className="btn btn-primary">{editing ? 'ذخیره' : 'ایجاد'}</button>
            </div>
          </div>
        </form>
      </dialog>
    </div>
  );
}
