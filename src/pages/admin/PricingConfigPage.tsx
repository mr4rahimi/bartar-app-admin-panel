// D:\projects\bartar-app\admin-panel\src\pages\admin\PricingConfigPage.tsx
import { useEffect, useState } from 'react';
import client from '../../api/client';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

type PricingConfig = {
  id: number;
  partMarkupPercent: number;
  createdAt: string;
  updatedAt: string;
};

type FormValues = {
  partMarkupPercent: number | string;
};

export default function PricingConfigPage() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<PricingConfig | null>(null);

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { partMarkupPercent: '' },
  });

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await client.get('/admin/pricing-config');
      const data: PricingConfig = res.data;
      setConfig(data);
      reset({
        partMarkupPercent:
          typeof data.partMarkupPercent === 'number'
            ? data.partMarkupPercent
            : '',
      });
    } catch (e: any) {
      console.error(e);
      // اگر 404 بده یعنی هنوز تنظیمات نداریم، فرم خالی می‌مونه
      if (e?.response?.status !== 404) {
        toast.error(e?.response?.data?.message || 'خطا در دریافت تنظیمات قیمت‌گذاری');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(data: FormValues) {
    try {
      const value = Number(data.partMarkupPercent || 0);
      const payload = { partMarkupPercent: value || 0 };

      const res = await client.put('/admin/pricing-config', payload);
      const updated: PricingConfig = res.data;
      setConfig(updated);
      reset({
        partMarkupPercent: updated.partMarkupPercent,
      });
      toast.success('تنظیمات قیمت‌گذاری با موفقیت ذخیره شد');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'خطا در ذخیره تنظیمات قیمت‌گذاری');
    }
  }

  return (
    <div className="bp-pricingconfig-page-root-superLongUniqueClass_100 bp-page-aurora-2025">
      <div className="bp-pricingconfig-card-superLongUniqueClass_101">
        <div className="bp-pricingconfig-header-superLongUniqueClass_102">
          <h3 className="bp-pricingconfig-title-superLongUniqueClass_103">
            تنظیمات قیمت‌گذاری قطعات
          </h3>
          <p className="bp-pricingconfig-subtitle-superLongUniqueClass_104">
            در این بخش می‌توانید درصد کلی اضافه‌شونده به قیمت قطعات را تعیین کنید تا در محاسبه قیمت پایه استفاده شود.
          </p>
        </div>

        <form
          className="bp-pricingconfig-form-superLongUniqueClass_105"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="bp-pricingconfig-form-row-superLongUniqueClass_106">
            <label>درصد اضافه روی قیمت قطعه (٪)</label>
            <input
              type="number"
              step={0.1}
              className="bp-pricingconfig-input-superLongUniqueClass_107"
              placeholder="مثلاً 10 یعنی 10٪"
              disabled={loading}
              {...register('partMarkupPercent')}
            />
            <p className="bp-pricingconfig-help-superLongUniqueClass_108">
              اگر این مقدار خالی یا صفر باشد، هیچ درصد اضافه‌ای روی قیمت قطعات اعمال نمی‌شود.
            </p>
          </div>

          <div className="bp-pricingconfig-footer-superLongUniqueClass_109">
            <button
              type="button"
              className="btn btn-ghost bp-pricingconfig-btn-ghost-superLongUniqueClass_110"
              onClick={loadConfig}
              disabled={loading}
            >
              {loading ? 'در حال بروزرسانی...' : 'بازیابی آخرین مقدار'}
            </button>
            <button
              type="submit"
              className="btn btn-primary bp-pricingconfig-btn-primary-superLongUniqueClass_111"
              disabled={loading}
            >
              ذخیره تنظیمات
            </button>
          </div>

          {config && (
            <div className="bp-pricingconfig-meta-superLongUniqueClass_112">
              <span>
                آخرین بروزرسانی:{' '}
                {new Date(config.updatedAt).toLocaleString('fa-IR')}
              </span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
