// D:\projects\bartar-app\admin-panel\src\pages\admin\ProblemPage.tsx
import { useEffect, useState } from 'react';
import client from '../../api/client';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

type Service = { id: number; name: string; slug?: string };
type Problem = { id: number; name: string; code?: string; serviceId?: number; service?: Service };

export default function ProblemPage(){
  const [services, setServices] = useState<Service[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const { register, handleSubmit, reset } = useForm();

  async function load(){
    try {
      const [rs, rp] = await Promise.all([client.get('/admin/services'), client.get('/admin/problems')]);

      setServices(rs.data || []);
      setProblems(rp.data || []);
    } catch(err:any) {
      console.error('Failed to load problems/services', err);
      if (err?.response) console.error('Server response data:', err.response.data);
      toast.error('خطا در بارگذاری داده‌ها');
    }
  }

  useEffect(()=>{ load(); }, []);

  async function onCreate(rawData: any){
    try{
      const payload = {
        name: (rawData.name || '').trim(),
        code: rawData.code ? String(rawData.code).trim() : undefined,
        serviceId: rawData.serviceId ? Number(rawData.serviceId) : undefined,
      };

      if (!payload.name) { toast.error('نام مشکل الزامی است'); return; }
      if (!payload.serviceId) { toast.error('سرویس را انتخاب کنید'); return; }

      await client.post('/admin/problems', payload);
      toast.success('مشکل اضافه شد');
      reset();
      load();
    } catch(e:any) {
      console.error('Create problem error:', e);
      if (e?.response) {
        toast.error(e.response?.data?.message || 'خطای سرور');
      } else {
        toast.error('خطا در ارسال درخواست');
      }
    }
  }

  return (
    <div className="problems-panel bp-page-aurora-2025">
      <div className="problems-header bp-surface-aurora-2025">
        <div>
          <h3 className="problems-title">مشکلات</h3>
          <p className="problems-sub">ایجاد و مدیریت مشکلات مرتبط با خدمات</p>
        </div>

        <div className="problems-controls">
          {/* reserved for future actions */}
        </div>
      </div>

      <div className="problem-form-card bp-surface-aurora-2025">
        <form onSubmit={handleSubmit(onCreate)} className="problem-form">
          <div className="problem-form-grid">
            <div className="form-field">
              <label className="form-label">نام مشکل</label>
              <input {...register('name')} placeholder="مثلاً تعویض ال‌سی‌دی" className="form-input" />
            </div>

            <div className="form-field">
              <label className="form-label">سرویس</label>
              <select {...register('serviceId')} className="form-input">
                <option value="">انتخاب سرویس</option>
                {services.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">کد (اختیاری)</label>
              <input {...register('code')} placeholder="کد مشکل" className="form-input" />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">اضافه کن</button>
            </div>
          </div>
        </form>
      </div>

      <div className="problems-list bp-surface-aurora-2025">
        {problems.length === 0 ? (
          <div className="problems-empty">مشکلی یافت نشد</div>
        ) : (
          problems.map(p => (
            <div key={p.id} className="problem-card">
              <div className="problem-main">
                <div className="problem-name">{p.name}</div>
                <div className="problem-code">{p.code || ''}</div>
              </div>
              <div className="problem-meta">سرویس: <span className="muted">{p.service?.name || p.serviceId}</span></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
