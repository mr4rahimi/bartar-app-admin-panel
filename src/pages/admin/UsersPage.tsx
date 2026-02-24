// D:\projects\bartar-app\admin-panel\src\pages\admin\UsersPage.tsx
import  { useEffect, useState } from 'react';
import client from '../../api/client';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

type User = {
  id: number;
  name?: string;
  phone: string;
  email?: string;
  role?: string;
  walletBalance?: number;
  createdAt?: string;
};

export default function UsersPage(){
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const { register, handleSubmit, reset } = useForm();

  async function load() {
    try {
      const res = await client.get('/admin/users');
      setUsers(res.data.items ?? res.data);
    } catch (e:any) {
      console.error('load users', e);
      toast.error('خطا در بارگذاری کاربران');
    }
  }

  useEffect(()=>{ load() }, []);

  function openCreate() {
    setEditing(null);
    reset({ phone: '', name: '', email: '' });
    (document.getElementById('user-modal') as any)?.showModal?.();
  }

  function openEdit(u: User) {
    setEditing(u);
    reset({ name: u.name, email: u.email, phone: u.phone });
    (document.getElementById('user-modal') as any)?.showModal?.();
  }

  async function onSave(data:any) {
    try {
      if (editing) {
        await client.put(`/admin/users/${editing.id}`, data);
        toast.success('کاربر ویرایش شد');
      } else {
        const resp = await client.post('/admin/users', data);
        if (resp.data.rawPassword) {
          toast.info(`رمز موقت: ${resp.data.rawPassword}`);
        }
        toast.success('کاربر ایجاد شد');
      }
      (document.getElementById('user-modal') as any).close();
      load();
    } catch (e:any) {
      console.error('save user', e);
      toast.error(e?.response?.data?.message || 'خطا');
    }
  }

  async function removeUser(id:number) {
    if (!confirm('آیا حذف کاربر مطمئن هستید؟')) return;
    await client.delete(`/admin/users/${id}`);
    toast.success('حذف شد');
    load();
  }

  // wallet adjust
  function openWallet(u: User) {
    setEditing(u);
    (document.getElementById('wallet-modal') as any)?.showModal?.();
    (document.getElementById('wallet-amount') as any).value = '';
  }

  async function onAdjustWallet(e: any) {
    e.preventDefault();
    const amount = Number((document.getElementById('wallet-amount') as any).value);
    const type = (document.getElementById('wallet-type') as any).value;
    const note = (document.getElementById('wallet-note') as any).value;
    if (!editing) return;
    try {
      await client.post(`/admin/users/${editing.id}/wallet`, { amount, type, note });
      toast.success('کیف‌پول بروزرسانی شد');
      (document.getElementById('wallet-modal') as any).close();
      load();
    } catch (err:any) {
      console.error('wallet adjust', err);
      toast.error('خطا در ویرایش کیف‌پول');
    }
  }

  const formatDate = (d?: string) => d ? new Date(d).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' }) : '-';

  return (
    <div className="users-panel bp-page-aurora-2025">
      {/* header */}
      <div className="users-header bp-surface-aurora-2025">
        <div>
          <h3 className="users-title">کاربران</h3>
          <p className="users-sub">مدیریت کامل کاربران — مشاهده، ویرایش و مدیریت کیف‌پول</p>
        </div>

        <div className="users-actions">
          <input placeholder="جستجو بر اساس نام / تلفن / ایمیل..." className="users-search" />
          <button className="btn btn-secondary" onClick={openCreate}>ایجاد کاربر</button>
        </div>
      </div>

      {/* table card */}
      <div className="users-table-card bp-surface-aurora-2025">
        <div className="users-table-wrapper">
          <table className="users-table">
            <colgroup>
              <col style={{ width: '6%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '12%' }} />
            </colgroup>

            <thead className="users-thead">
              <tr>
                <th className="users-th">#</th>
                <th className="users-th">نام</th>
                <th className="users-th">تلفن</th>
                <th className="users-th">ایمیل</th>
                <th className="users-th">کیف‌پول</th>
                <th className="users-th">تاریخ ثبت</th>
                <th className="users-th">عملیات</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id} className={`users-tr ${idx % 2 === 0 ? 'even' : 'odd'}`}>
                  <td className="users-td">{u.id}</td>
                  <td className="users-td">
                    <div className="user-cell">
                      <div className="user-avatar">{u.name ? u.name[0] : u.phone?.slice(-2)}</div>
                      <div className="user-meta">
                        <div className="user-name ">{u.name || '—'}</div>
                        <div className="user-role">{u.role || 'کاربر'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="users-td">{u.phone}</td>
                  <td className="users-td">{u.email || '-'}</td>
                  <td className="users-td">{u.walletBalance ?? 0} تومان</td>
                  <td className="users-td">{formatDate(u.createdAt)}</td>
                  <td className="users-td">
                    <div className="users-row-actions">
                      <button className="action-btn edit" onClick={() => openEdit(u)}>ویرایش</button>
                      <button className="action-btn danger" onClick={() => removeUser(u.id)}>حذف</button>
                      <button className="action-btn alt" onClick={() => openWallet(u)}>کیف‌پول</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* pagination (UI only) */}
        <div className="users-footer">
          <div className="users-footer-left">
            <span className="text-sm text-muted">نمایش</span>
            <select className="select-per-page">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            <span className="text-sm text-muted">از {users.length} مورد</span>
          </div>

          <div className="users-pagination">
            <button className="page-btn">‹</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn">›</button>
          </div>
        </div>
      </div>

      {/* user modal */}
      <dialog id="user-modal" className="modal-dialog">
        <form className="modal-card" onSubmit={handleSubmit(onSave)}>
          <div className="modal-header">
            <h4 className="modal-title">{editing ? 'ویرایش کاربر' : 'ایجاد کاربر'}</h4>
            <div>
              <button type="button" className="btn btn-ghost" onClick={() => (document.getElementById('user-modal') as any).close()}>بستن</button>
            </div>
          </div>

          <div className="modal-body">
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">شماره موبایل</label>
                <input {...register('phone', { required: true })} className="form-input" placeholder="09xxxxxxxx" />
              </div>
              <div className="form-field">
                <label className="form-label">نام</label>
                <input {...register('name')} className="form-input" placeholder="نام کاربر" />
              </div>
              <div className="form-field">
                <label className="form-label">ایمیل</label>
                <input {...register('email')} className="form-input" placeholder="email@example.com" />
              </div>
              <div className="form-field">
                <label className="form-label">رمز (اختیاری)</label>
                <input {...register('password')} className="form-input" placeholder="رمز" />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => (document.getElementById('user-modal') as any).close()}>انصراف</button>
            <button type="submit" className="btn btn-primary">{editing ? 'ذخیره' : 'ایجاد'}</button>
          </div>
        </form>
      </dialog>

      {/* wallet modal */}
      <dialog id="wallet-modal" className="modal-dialog">
        <form className="modal-card" onSubmit={onAdjustWallet}>
          <div className="modal-header">
            <h4 className="modal-title">تعدیل کیف‌پول {editing?.phone}</h4>
            <div>
              <button type="button" className="btn btn-ghost" onClick={() => (document.getElementById('wallet-modal') as any).close()}>بستن</button>
            </div>
          </div>

          <div className="modal-body">
            <div className="form-grid single-col">
              <div className="form-field">
                <label className="form-label">مقدار (مثبت برای افزایش / منفی برای کسر)</label>
                <input id="wallet-amount" placeholder="مثال: 10000 یا -5000" className="form-input" />
              </div>

              <div className="form-field">
                <label className="form-label">نوع</label>
                <input id="wallet-type" placeholder="مثال: admin_adjust" className="form-input" />
              </div>

              <div className="form-field">
                <label className="form-label">توضیحات</label>
                <input id="wallet-note" placeholder="توضیحات (اختیاری)" className="form-input" />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => (document.getElementById('wallet-modal') as any).close()}>انصراف</button>
            <button type="submit" className="btn btn-primary">ثبت</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
