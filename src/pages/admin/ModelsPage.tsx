// D:\projects\bartar-app\admin-panel\src\pages\admin\ModelsPage.tsx
import { useEffect, useState } from 'react';
import client from '../../api/client';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';


type Brand = { id: number; name: string; slug?: string };
type Service = { id: number; name: string; slug?: string };
type DeviceModel = { id: number; name: string; code?: string; brandId?: number; serviceId?: number; brand?: Brand; service?: Service };

export default function ModelsPage(){
  const [brands, setBrands] = useState<Brand[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [models, setModels] = useState<DeviceModel[]>([]);
  const { register, handleSubmit, reset } = useForm();

  async function load(){
    try {
      const [rb, rs, rm] = await Promise.all([
        client.get('/admin/brands'),
        client.get('/admin/services'),
        client.get('/admin/models'),
      ]);
      setBrands(rb.data || []);
      setServices(rs.data || []);
      setModels(rm.data || []);
    } catch(err:any) {
      console.error('Failed to load models/brands/services', err);
      toast.error('خطا در بارگذاری داده‌ها');
    }
  }

  useEffect(()=>{ load(); }, []);

  // single create
  async function onCreate(rawData: any){
    try{
      // sanitize & validate
      const payload: any = {
        name: (rawData.name || '').trim(),
        code: rawData.code ? String(rawData.code).trim() : undefined,
        brandId: rawData.brandId ? Number(rawData.brandId) : undefined,
        serviceId: rawData.serviceId ? Number(rawData.serviceId) : undefined,
      };

      if (!payload.name) {
        toast.error('نام مدل الزامی است');
        return;
      }
      if (!payload.brandId) {
        toast.error('برند را انتخاب کنید');
        return;
      }

      await client.post('/admin/models', payload);
      toast.success('مدل ساخته شد');
      reset();
      load();
    } catch(e:any) {
      console.error('Create model error:', e);
      if (e?.response) {
        toast.error(e.response?.data?.message || 'خطای سرور هنگام ساخت مدل');
      } else {
        toast.error('خطا در ارسال درخواست (Network)');
      }
    }
  }

  return (
    <div className="models-panel bp-page-aurora-2025">
      <div className="models-header bp-surface-aurora-2025">
        <div>
          <h3 className="models-title">مدل‌ها</h3>
          <p className="models-sub">مدیریت مدل‌ها — ایجاد، مشاهده و ویرایش</p>
        </div>

        <div className="models-controls">
          {/* CSV upload removed as requested */}
          <button className="btn btn-secondary" onClick={() => { /* reserved for future filters */ }}>
            فیلترها
          </button>
        </div>
      </div>

      {/* create form */}
      <div className="model-form-card bp-surface-aurora-2025">
        <form className="model-form" onSubmit={handleSubmit(onCreate)}>
          <div className="model-form-grid">
            <div className="form-field">
              <label className="form-label">نام مدل</label>
              <input {...register('name')} placeholder="نام مدل" className="form-input" />
            </div>

            <div className="form-field">
              <label className="form-label">برند</label>
              <select {...register('brandId')} className="form-input">
                <option value="">انتخاب برند</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">سرویس (اختیاری)</label>
              <select {...register('serviceId')} className="form-input">
                <option value="">انتخاب سرویس</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">کد مدل (اختیاری)</label>
              <input {...register('code')} placeholder="کد مدل" className="form-input" />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">اضافه کن</button>
            </div>
          </div>
        </form>
      </div>

      {/* list */}
      <div className="models-list bp-surface-aurora-2025">
        {models.length === 0 ? (
          <div className="models-empty">مدلی یافت نشد</div>
        ) : (
          models.map(m => (
            <div key={m.id} className="model-card">
              <div className="model-main">
                <div className="model-name">{m.name}</div>
                <div className="model-meta">{m.code ? `کد: ${m.code}` : ''}</div>
              </div>
              <div className="model-right">
                <div className="model-brand">برند: <span className="muted">{m.brand?.name || m.brandId}</span></div>
                <div className="model-service">سرویس: <span className="muted">{m.service?.name || '-'}</span></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
