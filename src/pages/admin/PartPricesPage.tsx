import { useEffect, useState, useMemo } from 'react';
import client from '../../api/client';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { Edit, Trash2, Plus, Search, Filter } from 'lucide-react';

type OptionType = { value: number; label: string };

type Service = { id: number; name: string; slug: string };
type Brand = { id: number; name: string; services?: any[] };
type Part = { id: number; name: string; serviceId: number };
type DeviceModel = { id: number; name: string; brandId: number; serviceId?: number | null };

type PartPrice = {
  id: number;
  serviceId: number;
  brandId?: number | null;
  modelId?: number | null;
  partId: number;
  price: number;
  highCopyPrice?: number | null;
  copyPrice?: number | null; 
  createdAt: string;
  updatedAt: string;
  service?: { id: number; name: string };
  brand?: { id: number; name: string };
  model?: { id: number; name: string };
  part?: { id: number; name: string };
};

type FilterState = {
  serviceId?: number;
  brandId?: number;
  modelId?: number;
  partId?: number;
  q?: string;
};

type FormValues = {
  serviceId: OptionType | null;
  brandId: OptionType | null;
  modelId: OptionType | null;
  partId: OptionType | null;
  price: number | string;

  highCopyPrice: number | string;
  copyPrice: number | string;
};

export default function PartPricesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [models, setModels] = useState<DeviceModel[]>([]);
  const [prices, setPrices] = useState<PartPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBase, setLoadingBase] = useState(true);

  // فیلترها
  const [filterServiceId, setFilterServiceId] = useState<number | undefined>();
  const [filterBrandId, setFilterBrandId] = useState<number | undefined>();
  const [filterModelId, setFilterModelId] = useState<number | undefined>();
  const [filterPartId, setFilterPartId] = useState<number | undefined>();
  const [filterSearch, setFilterSearch] = useState('');
  const [filterState, setFilterState] = useState<FilterState>({});

  // فرم مودال
  const [editing, setEditing] = useState<PartPrice | null>(null);
  const { control, register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: {
      serviceId: null,
      brandId: null,
      modelId: null,
      partId: null,
      price: '',
      highCopyPrice: '',
      copyPrice: '',
    },
  });

  const watchServiceField = watch('serviceId');
  const watchBrandField = watch('brandId');

  // ===== Helpers =====

  const serviceOptions: OptionType[] = services.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  function brandOptionsForService(serviceId?: number): OptionType[] {
    if (!serviceId) {
      return brands.map((b) => ({ value: b.id, label: b.name }));
    }
    return brands
      .filter((b) =>
        (b.services || []).some((x: any) => x.service && x.service.id === serviceId),
      )
      .map((b) => ({ value: b.id, label: b.name }));
  }

  function partOptionsForService(serviceId?: number): OptionType[] {
    if (!serviceId) return [];
    return parts
      .filter((p) => p.serviceId === serviceId)
      .map((p) => ({ value: p.id, label: p.name }));
  }

  function modelOptionsForBrand(serviceId?: number, brandId?: number): OptionType[] {
    if (!brandId) return [];
    return models
      .filter(
        (m) =>
          m.brandId === brandId &&
          (!serviceId || !m.serviceId || m.serviceId === serviceId),
      )
      .map((m) => ({ value: m.id, label: m.name }));
  }

  // ===== API loaders =====

  async function loadBaseData() {
    try {
      setLoadingBase(true);

      const [rs, rb, rparts, rmodels] = await Promise.all([
        client.get('/admin/services'),
        client.get('/admin/brands'),
        client.get('/admin/parts'),
        client.get('/admin/models'),
      ]);

      setServices(rs.data || []);
      setBrands(rb.data || []);
      setParts(Array.isArray(rparts.data) ? rparts.data : []);
      setModels(Array.isArray(rmodels.data) ? rmodels.data : []);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'خطا در دریافت داده‌های پایه');
    } finally {
      setLoadingBase(false);
    }
  }

  async function loadPrices() {
    setLoading(true);
    try {
      const rp = await client.get('/admin/part-prices', {
        params: {
          serviceId: filterState.serviceId,
          brandId: filterState.brandId,
          modelId: filterState.modelId,
          partId: filterState.partId,
          q: filterState.q,
        },
      });

      const raw = rp.data;
      let list: PartPrice[] = [];

      if (Array.isArray(raw)) list = raw;
      else if (raw && Array.isArray(raw.items)) list = raw.items;
      else if (raw && Array.isArray(raw.data)) list = raw.data;
      else if (raw && Array.isArray(raw.results)) list = raw.results;

      setPrices(list);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'خطا در دریافت قیمت‌ها');
    } finally {
      setLoading(false);
    }
  }

  // ===== Effects =====

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    // بعد از لود داده‌های پایه، لیست قیمت‌ها رو هم بگیر
    if (!loadingBase) {
      loadPrices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loadingBase,
    filterState.serviceId,
    filterState.brandId,
    filterState.modelId,
    filterState.partId,
    filterState.q,
  ]);

  // ===== Filter handlers =====

  function handleFilterServiceChange(opt: OptionType | null) {
    const sid = opt?.value;
    setFilterServiceId(sid);
    setFilterBrandId(undefined);
    setFilterModelId(undefined);
    setFilterPartId(undefined);
  }

  function handleFilterBrandChange(opt: OptionType | null) {
    const bid = opt?.value;
    setFilterBrandId(bid);
    setFilterModelId(undefined);
  }

  function handleFilterModelChange(opt: OptionType | null) {
    setFilterModelId(opt?.value);
  }

  function handleFilterPartChange(opt: OptionType | null) {
    setFilterPartId(opt?.value);
  }

  function handleApplyFilter() {
    setFilterState({
      serviceId: filterServiceId,
      brandId: filterBrandId,
      modelId: filterModelId,
      partId: filterPartId,
      q: filterSearch.trim() || undefined,
    });
  }

  function handleClearFilter() {
    setFilterServiceId(undefined);
    setFilterBrandId(undefined);
    setFilterModelId(undefined);
    setFilterPartId(undefined);
    setFilterSearch('');
    setFilterState({});
  }

  // ===== Modal handlers =====

  function openCreateModal() {
    setEditing(null);
    reset({
      serviceId: null,
      brandId: null,
      modelId: null,
      partId: null,
      price: '',
      highCopyPrice: '',
      copyPrice: '',
    });
    (document.getElementById('bp-partpricing-modal') as HTMLDialogElement)?.showModal?.();
  }

  function openEditModal(item: PartPrice) {
    setEditing(item);

    const serviceOpt = serviceOptions.find((s) => s.value === item.serviceId) || null;
    const brandOpts = brandOptionsForService(item.serviceId);
    const brandOpt = item.brandId
      ? brandOpts.find((b) => b.value === item.brandId) || null
      : null;

    const partOpts = partOptionsForService(item.serviceId);
    const partOpt = partOpts.find((p) => p.value === item.partId) || null;

    const modelOpts = modelOptionsForBrand(item.serviceId, item.brandId || undefined);
    const modelOpt = item.modelId
      ? modelOpts.find((m) => m.value === item.modelId) || null
      : null;

    reset({
      serviceId: serviceOpt,
      brandId: brandOpt,
      modelId: modelOpt,
      partId: partOpt,
      price: item.price,
      highCopyPrice: item.highCopyPrice ?? '',
      copyPrice: item.copyPrice ?? '',
    });

    (document.getElementById('bp-partpricing-modal') as HTMLDialogElement)?.showModal?.();
  }

  async function onSubmitForm(data: FormValues) {
    try {
      const serviceId = data.serviceId?.value;
      const brandId = data.brandId?.value;
      const modelId = data.modelId?.value;
      const partId = data.partId?.value;
      const priceNumber = Number(data.price);

      const highCopyPriceNumber =
  data.highCopyPrice === '' || data.highCopyPrice === null
    ? undefined
    : Number(data.highCopyPrice);
const copyPriceNumber =
  data.copyPrice === '' || data.copyPrice === null
    ? undefined
    : Number(data.copyPrice);

if (!serviceId || !partId || Number.isNaN(priceNumber)) {
  toast.error('سرویس، قطعه و قیمت معتبر الزامی است');
  return;
}

const payload: any = {
  serviceId,
  brandId,
  modelId,
  partId,
  price: priceNumber,
};

// فقط اگر وارد شده باشن، بفرستیم
if (!Number.isNaN(highCopyPriceNumber as number)) {
  payload.highCopyPrice = highCopyPriceNumber;
}
if (!Number.isNaN(copyPriceNumber as number)) {
  payload.copyPrice = copyPriceNumber;
}
      if (editing) {
        await client.put(`/admin/part-prices/${editing.id}`, payload);
        toast.success('قیمت قطعه با موفقیت ویرایش شد');
      } else {
        await client.post('/admin/part-prices', payload);
        toast.success('قیمت قطعه ثبت شد');
      }

      (document.getElementById('bp-partpricing-modal') as HTMLDialogElement)?.close?.();
      loadPrices();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'خطا در ذخیره قیمت قطعه');
    }
  }

  async function handleDeletePrice(id: number) {
    if (!confirm('از حذف این ردیف قیمت مطمئن هستید؟')) return;
    try {
      await client.delete(`/admin/part-prices/${id}`);
      toast.success('ردیف قیمت حذف شد');
      loadPrices();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'خطا در حذف ردیف قیمت');
    }
  }

  // ===== Modal dynamic options (فقط روی state موجود فیلتر می‌کنیم) =====

  const selectedServiceId = watchServiceField?.value;
  const selectedBrandId = watchBrandField?.value;

  const modalBrandOptions = brandOptionsForService(selectedServiceId);
  const modalPartOptions = partOptionsForService(selectedServiceId);
  const modalModelOptions = modelOptionsForBrand(selectedServiceId, selectedBrandId);

  // ===== Filter dynamic options =====
  const filterBrandOptions = brandOptionsForService(filterServiceId);
  const filterPartOptions = partOptionsForService(filterServiceId);
  const filterModelOptions = modelOptionsForBrand(filterServiceId, filterBrandId);

  const isPricesArray = Array.isArray(prices);

  // ===== Live search (client-side) روی لیست قیمت‌های فعلی =====
  const visiblePrices: PartPrice[] = useMemo(() => {
    if (!isPricesArray) return [];

    const q = filterSearch.trim().toLowerCase();
    if (!q) return prices;

    return prices.filter((row) => {
      const serviceName = row.service?.name || '';
      const brandName = row.brand?.name || '';
      const modelName = row.model?.name || '';
      const partName = row.part?.name || '';

      const combined = `${serviceName} ${brandName} ${modelName} ${partName}`.toLowerCase();
      return combined.includes(q);
    });
  }, [isPricesArray, prices, filterSearch]);

  // ===== Render =====

  return (
    <div className="bp-partpricing-page-root bp-page-aurora-2025">
      {/* Header */}
      <div className="bp-partpricing-header">
        <div className="bp-partpricing-header-text">
          <h3 className="bp-partpricing-title">قیمت‌گذاری قطعات</h3>
          <p className="bp-partpricing-subtitle">
            برای هر سرویس، برند، مدل و قطعه، قیمت قطعه را مشخص کنید تا در محاسبه قیمت پایه استفاده شود.
          </p>
        </div>

        <div className="bp-partpricing-header-actions">
          <button
            className="btn btn-secondary bp-partpricing-btn-primary"
            onClick={openCreateModal}
          >
            <Plus className="bp-partpricing-icon" />
            <span>افزودن قیمت جدید</span>
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bp-partpricing-filter-card">
        <div className="bp-partpricing-filter-header">
          <div className="bp-partpricing-filter-title-block">
            <Filter className="bp-partpricing-icon-muted" />
            <div>
              <div className="bp-partpricing-filter-title">فیلتر پیشرفته قیمت‌ها</div>
              <div className="bp-partpricing-filter-caption">
                بر اساس سرویس، برند، مدل و قطعه لیست قیمت‌ها را محدود کنید.
              </div>
            </div>
          </div>
          <div className="bp-partpricing-filter-actions-top">
            <button
              className="btn btn-ghost bp-partpricing-btn-ghost"
              onClick={handleClearFilter}
            >
              پاک‌کردن فیلترها
            </button>
            <button
              className="btn btn-primary bp-partpricing-btn-apply"
              onClick={handleApplyFilter}
            >
              اعمال فیلتر
            </button>
          </div>
        </div>

        <div className="bp-partpricing-filter-grid">
          <div className="bp-partpricing-filter-field">
            <label>سرویس</label>
            <Select
              classNamePrefix="react-select"
              placeholder="انتخاب سرویس..."
              options={serviceOptions}
              value={
                filterServiceId
                  ? serviceOptions.find((s) => s.value === filterServiceId) || null
                  : null
              }
              onChange={handleFilterServiceChange}
              isClearable
              isDisabled={loadingBase}
            />
          </div>

          <div className="bp-partpricing-filter-field">
            <label>برند</label>
            <Select
              classNamePrefix="react-select"
              placeholder="همه برندها"
              isClearable
              isDisabled={loadingBase || !filterServiceId}
              options={filterBrandOptions}
              value={
                filterBrandId
                  ? filterBrandOptions.find((b) => b.value === filterBrandId) || null
                  : null
              }
              onChange={handleFilterBrandChange}
            />
          </div>

          <div className="bp-partpricing-filter-field">
            <label>مدل</label>
            <Select
              classNamePrefix="react-select"
              placeholder="همه مدل‌ها"
              isClearable
              isDisabled={loadingBase || !filterBrandId}
              options={filterModelOptions}
              value={
                filterModelId
                  ? filterModelOptions.find((m) => m.value === filterModelId) || null
                  : null
              }
              onChange={handleFilterModelChange}
            />
          </div>

          <div className="bp-partpricing-filter-field">
            <label>قطعه</label>
            <Select
              classNamePrefix="react-select"
              placeholder="همه قطعات"
              isClearable
              isDisabled={loadingBase || !filterServiceId}
              options={filterPartOptions}
              value={
                filterPartId
                  ? filterPartOptions.find((p) => p.value === filterPartId) || null
                  : null
              }
              onChange={handleFilterPartChange}
            />
          </div>

          <div className="bp-partpricing-filter-field bp-partpricing-filter-field-span">
            <label>جستجو (نام سرویس / برند / مدل / قطعه)</label>
            <div className="bp-partpricing-search-wrapper">
              <Search className="bp-partpricing-search-icon" />
              <input
                className="bp-partpricing-search-input_superLongUniqueClassForPartPricesLiveSearch_01"
                placeholder="مثلاً: آیفون 12 LCD اپل ..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bp-partpricing-list-wrapper">
        {loadingBase ? (
          <div className="bp-partpricing-loading">در حال بارگذاری داده‌های پایه...</div>
        ) : loading ? (
          <div className="bp-partpricing-loading">در حال بارگذاری لیست قیمت‌ها...</div>
        ) : !isPricesArray || visiblePrices.length === 0 ? (
          <div className="bp-partpricing-empty-state">
            <p>هیچ ردیف قیمتی مطابق فیلترها / جستجوی فعلی یافت نشد.</p>
            <button
              className="btn btn-secondary bp-partpricing-btn-primary"
              onClick={openCreateModal}
            >
              ثبت اولین قیمت قطعه
            </button>
          </div>
        ) : (
          <div className="bp-partpricing-table-container">
            <table className="bp-partpricing-table">
              <thead>
  <tr>
    <th>سرویس</th>
    <th>برند</th>
    <th>مدل</th>
    <th>قطعه</th>
    <th>قیمت اصلی (تومان)</th>
    <th>قیمت های‌کپی</th>
    <th>قیمت کپی</th>
    <th>آخرین بروزرسانی</th>
    <th>عملیات</th>
  </tr>
</thead>
              <tbody>
                {visiblePrices.map((row) => (
                  <tr key={row.id}>
                    <td>{row.service?.name || `#${row.serviceId}`}</td>
                    <td>{row.brand?.name || (row.brandId ? `#${row.brandId}` : '-')}</td>
                    <td>{row.model?.name || (row.modelId ? `#${row.modelId}` : '-')}</td>
                    <td>{row.part?.name || `#${row.partId}`}</td>
                    <td>{row.price.toLocaleString('fa-IR')}</td>
                    <td>
  {row.highCopyPrice != null
    ? row.highCopyPrice.toLocaleString('fa-IR')
    : '-'}
</td>
<td>
  {row.copyPrice != null
    ? row.copyPrice.toLocaleString('fa-IR')
    : '-'}
</td>
                    <td>{new Date(row.updatedAt).toLocaleString('fa-IR')}</td>
                    <td>
                      <div className="bp-partpricing-row-actions">
                        <button
                          className="bp-partpricing-icon-btn bp-partpricing-icon-btn-edit"
                          onClick={() => openEditModal(row)}
                          title="ویرایش"
                        >
                          <Edit className="bp-partpricing-icon" />
                        </button>
                        <button
                          className="bp-partpricing-icon-btn bp-partpricing-icon-btn-remove"
                          onClick={() => handleDeletePrice(row.id)}
                          title="حذف"
                        >
                          <Trash2 className="bp-partpricing-icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <dialog id="bp-partpricing-modal" className="bp-partpricing-modal">
        <form
          className="bp-partpricing-form"
          onSubmit={handleSubmit(onSubmitForm)}
          method="dialog"
        >
          <div className="bp-partpricing-form-header">
            <h4>{editing ? 'ویرایش قیمت قطعه' : 'ثبت قیمت جدید برای قطعه'}</h4>
            <button
              type="button"
              className="btn btn-ghost bp-partpricing-btn-ghost"
              onClick={() =>
                (document.getElementById('bp-partpricing-modal') as HTMLDialogElement).close()
              }
            >
              بستن
            </button>
          </div>

          <div className="bp-partpricing-form-body">
            {/* Service */}
            <div className="bp-partpricing-form-row">
              <label>سرویس</label>
              <Controller
                control={control}
                name="serviceId"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    classNamePrefix="react-select"
                    placeholder="انتخاب سرویس..."
                    options={serviceOptions}
                    value={field.value}
                    onChange={(opt) => {
                      field.onChange(opt);
                      // ریست وابسته‌ها
                      reset((prev) => ({
                        ...prev,
                        serviceId: opt,
                        brandId: null,
                        modelId: null,
                        partId: null,
                      }));
                    }}
                    isDisabled={loadingBase}
                  />
                )}
              />
            </div>

            {/* Brand */}
            <div className="bp-partpricing-form-row">
              <label>برند (اختیاری)</label>
              <Controller
                control={control}
                name="brandId"
                render={({ field }) => (
                  <Select
                    classNamePrefix="react-select"
                    placeholder="همه برندها"
                    options={modalBrandOptions}
                    isClearable
                    isDisabled={loadingBase || !selectedServiceId}
                    value={field.value}
                    onChange={(opt) => {
                      field.onChange(opt);
                      reset((prev) => ({
                        ...prev,
                        brandId: opt,
                        modelId: null,
                      }));
                    }}
                  />
                )}
              />
            </div>

            {/* Model */}
            <div className="bp-partpricing-form-row">
              <label>مدل (اختیاری)</label>
              <Controller
                control={control}
                name="modelId"
                render={({ field }) => (
                  <Select
                    classNamePrefix="react-select"
                    placeholder="همه مدل‌ها"
                    options={modalModelOptions}
                    isClearable
                    isDisabled={loadingBase || modalModelOptions.length === 0}
                    value={field.value}
                    onChange={(opt) => field.onChange(opt)}
                  />
                )}
              />
            </div>

            {/* Part */}
            <div className="bp-partpricing-form-row">
              <label>قطعه</label>
              <Controller
                control={control}
                name="partId"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    classNamePrefix="react-select"
                    placeholder="انتخاب قطعه..."
                    options={modalPartOptions}
                    isDisabled={loadingBase || modalPartOptions.length === 0}
                    value={field.value}
                    onChange={(opt) => field.onChange(opt)}
                  />
                )}
              />
            </div>

            {/* Price */}
            <div className="bp-partpricing-form-row">
              <label>قیمت قطعه (تومان)</label>
              <input
                type="number"
                min={0}
                step={1000}
                className="bp-partpricing-input"
                {...register('price', { required: true })}
                placeholder="مثلاً 1500000"
              />
            </div>

            {/* High Copy Price */}
<div className="bp-partpricing-form-row">
  <label>قیمت های‌کپی (اختیاری)</label>
  <input
    type="number"
    min={0}
    step={1000}
    className="bp-partpricing-input"
    {...register('highCopyPrice')}
    placeholder="مثلاً 1300000"
  />
</div>

{/* Copy Price */}
<div className="bp-partpricing-form-row">
  <label>قیمت کپی (اختیاری)</label>
  <input
    type="number"
    min={0}
    step={1000}
    className="bp-partpricing-input"
    {...register('copyPrice')}
    placeholder="مثلاً 900000"
  />
</div>


          </div>

          <div className="bp-partpricing-form-footer">
            <button
              type="button"
              className="btn btn-ghost bp-partpricing-btn-ghost"
              onClick={() =>
                (document.getElementById('bp-partpricing-modal') as HTMLDialogElement).close()
              }
            >
              انصراف
            </button>
            <button
              type="submit"
              className="btn btn-primary bp-partpricing-btn-primary"
              disabled={loadingBase}
            >
              {editing ? 'ذخیره تغییرات' : 'ثبت قیمت'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
