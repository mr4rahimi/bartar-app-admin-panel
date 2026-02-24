import { useEffect, useState } from 'react';
import client from '../../api/client';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

type Service = {
  id: number;
  name: string;
  slug: string;
  iconUrl?: string;
  description?: string;
  active?: boolean;
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Service | null>(null);
  const { register, handleSubmit, reset } = useForm();

  async function load() {
    const res = await client.get('/admin/services');
    setServices(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    reset({ name: '', slug: '', iconUrl: '', description: '', active: true });
    (document.getElementById('service-modal') as HTMLDialogElement)?.showModal?.();
  }

  function openEdit(s: Service) {
    setEditing(s);
    reset(s as any);
    (document.getElementById('service-modal') as HTMLDialogElement)?.showModal?.();
  }

  async function onSubmit(data: any) {
    try {
      if (editing) {
        await client.put(`/admin/services/${editing.id}`, data);
        toast.success('خدمات بروزرسانی شد');
      } else {
        await client.post('/admin/services', data);
        toast.success('خدمات ساخته شد');
      }
      (document.getElementById('service-modal') as HTMLDialogElement)?.close?.();
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'خطا در عملیات');
    }
  }

  async function remove(id: number) {
    if (!confirm('آیا مطمئن هستید؟')) return;
    await client.delete(`/admin/services/${id}`);
    toast.success('حذف شد');
    load();
  }

  return (
    <div className="services-panel bp-page-aurora-2025">
      <div className="flex items-center justify-between mb-4 bp-surface-aurora-2025 services-header">
        <h3 className="text-xl font-bold">خدمات</h3>
        <button className="px-4 py-2 bg-accent text-white rounded" onClick={openCreate}>ایجاد سرویس</button>
      </div>

      <div className="grid gap-3 bp-surface-aurora-2025 services-list">
        {services.map(s => (
          <div key={s.id} className="p-3 rounded shadow-sm flex justify-between items-center services-card">
            <div>
              <div className="font-semibold">{s.name}</div>
              <div className="text-sm text-gray-500">{s.slug}</div>
            </div>

            <div className="flex gap-2">
              <button className="px-3 py-1 bg-yellow-100 rounded" onClick={() => openEdit(s)}>ویرایش</button>
              <button className="px-3 py-1 bg-red-100 rounded" onClick={() => remove(s.id)}>حذف</button>
            </div>
          </div>
        ))}
      </div>

      <dialog id="service-modal" className="p-0 rounded-md bp-modal-aurora-2025">
        <form className="p-6 bp-surface-aurora-2025" onSubmit={handleSubmit(onSubmit)}>
          <h4 className="text-lg mb-2">{editing ? 'ویرایش سرویس' : 'ایجاد سرویس'}</h4>

          <div className="space-y-2">
            <input {...register('name', { required: true })} placeholder="نام سرویس" className="w-full p-2 border rounded" />
            <input {...register('slug')} placeholder="slug (مثلاً mobile)" className="w-full p-2 border rounded" />
            <input {...register('iconUrl')} placeholder="آدرس آیکن (URL)" className="w-full p-2 border rounded" />
            <textarea {...register('description')} placeholder="توضیحات" className="w-full p-2 border rounded" />
            <div className="flex items-center gap-2">
              <label>فعال</label>
              <input type="checkbox" {...register('active')} />
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button type="button" onClick={() => (document.getElementById('service-modal') as HTMLDialogElement).close()} className="px-4 py-2">انصراف</button>
              <button type="submit" className="px-4 py-2 bg-accent text-white rounded">{editing ? 'ذخیره' : 'ایجاد'}</button>
            </div>
          </div>
        </form>
      </dialog>
    </div>
  );
}
