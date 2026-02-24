import { useEffect, useState } from 'react';
import client from '../../api/client';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

interface Technician {
  id: number;
  name: string;
  expertise: string;
  experienceYears?: number;
  bio?: string;
  createdAt: string;
}

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', expertise: '', experienceYears: '', bio: '' });
  const [saving, setSaving] = useState(false);

  async function loadTechnicians() {
    try {
      const res = await client.get('/admin/technicians');
      setTechnicians(res.data || []);
    } catch (err) {
      toast.error('خطا در بارگذاری تکنسین‌ها');
    } finally {
      setLoading(false);
    }
  }

  async function createTechnician() {
    try {
      setSaving(true);
      await client.post('/admin/technicians', {
        name: form.name,
        expertise: form.expertise,
        experienceYears: Number(form.experienceYears) || 0,
        bio: form.bio,
      });
      toast.success('تکنسین جدید با موفقیت اضافه شد');
      setOpen(false);
      setForm({ name: '', expertise: '', experienceYears: '', bio: '' });
      loadTechnicians();
    } catch (err) {
      toast.error('خطا در ایجاد تکنسین');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTechnician(id: number) {
    if (!confirm('آیا از حذف این تکنسین مطمئن هستید؟')) return;
    try {
      await client.delete(`/admin/technicians/${id}`);
      toast.success('تکنسین حذف شد');
      loadTechnicians();
    } catch {
      toast.error('خطا در حذف تکنسین');
    }
  }

  useEffect(() => {
    loadTechnicians();
  }, []);

  if (loading)
    return (
      <div className="tech-loading">
        <Loader2 className="tech-loader" />
      </div>
    );

  return (
    <div className="tech-page p-6 bp-page-aurora-2025">
      <Card className="tech-card bp-surface-aurora-2025">
        <CardHeader className="tech-card-header">
          <div>
            <CardTitle>مدیریت تکنسین‌ها</CardTitle>
            {/* خط توضیحات جانبی حذف شد (طبق درخواست) */}
          </div>

          <div className="tech-controls">
            <Input
              placeholder="جستجو نام یا تخصص..."
              className="tech-search"
              onChange={() => {
                /* reserved for future filtering */
              }}
            />

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary">افزودن تکنسین جدید</Button>
              </DialogTrigger>

              {/* اضافه کردن کلاس tech-dialog برای هدف‌گیری استایل راست‌چین فرم */}
              <DialogContent className="tech-dialog bp-modal-aurora-2025">
                <DialogHeader>
                  <DialogTitle className="text-right">ثبت تکنسین جدید</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="rtl-field">
                    <Label className="block">نام</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="مثلاً علی رضایی"
                      className="form-input"
                    />
                  </div>

                  <div className="rtl-field">
                    <Label className="block">تخصص</Label>
                    <Input
                      value={form.expertise}
                      onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                      placeholder="مثلاً تعمیر موبایل"
                      className="form-input"
                    />
                  </div>

                  <div className="rtl-field">
                    <Label className="block">سابقه (سال)</Label>
                    <Input
                      type="number"
                      value={form.experienceYears}
                      onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                      placeholder="مثلاً ۵"
                      className="form-input"
                    />
                  </div>

                  <div className="rtl-field">
                    <Label className="block">توضیحات</Label>
                    <Textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="چند خط درباره تجربه یا مهارت تکنسین بنویسید..."
                      className="form-input textarea-input"
                    />
                  </div>

                  <Button onClick={createTechnician} disabled={saving} className="w-full btn-primary">
                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : 'ثبت تکنسین'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="tech-table min-w-full">
              <thead className="tech-thead">
                <tr>
                  <th className="tech-th">شناسه</th>
                  <th className="tech-th">نام</th>
                  <th className="tech-th">تخصص</th>
                  <th className="tech-th">سابقه</th>
                  <th className="tech-th">توضیحات</th>
                  <th className="tech-th">تاریخ ثبت</th>
                  <th className="tech-th">عملیات</th>
                </tr>
              </thead>

              <tbody>
                {technicians.map((t, idx) => (
                  <tr key={t.id} className={`tech-tr ${idx % 2 === 0 ? 'even' : 'odd'}`}>
                    <td className="tech-td id-col">{t.id}</td>

                    <td className="tech-td name-col">
                      <div className="flex items-center justify-end gap-3">
                        <div className="avatar">{t.name?.[0] ?? 'T'}</div>
                        <div className="name-block">
                          <div className="name-text">{t.name}</div>
                          <div className="expert-text text-muted">{t.expertise}</div>
                        </div>
                      </div>
                    </td>

                    <td className="tech-td">{t.expertise}</td>
                    <td className="tech-td text-center">{t.experienceYears ?? '-'}</td>
                    <td className="tech-td small">{t.bio ?? '-'}</td>
                    <td className="tech-td">{new Date(t.createdAt).toLocaleString('fa-IR', { dateStyle: 'short' })}</td>

                    <td className="tech-td">
                      <div className="actions-row">
                        <Button variant="destructive" className="delete-btn" onClick={() => deleteTechnician(t.id)}>
                          حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
