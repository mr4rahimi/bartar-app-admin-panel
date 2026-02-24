// D:\projects\bartar-app\admin-panel\src\pages\admin\PartLaborsPage.tsx
import { useEffect, useMemo, useState } from 'react';
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

type PartLabor = {
  id: number;
  serviceId: number;
  partId: number;
  brandId?: number | null;
  modelId?: number | null;
  laborFee: number;
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
};

type FormValues = {
  serviceId: OptionType | null;
  brandId: OptionType | null;
  modelId: OptionType | null;
  partId: OptionType | null;
  laborFee: number | string;
};

export default function PartLaborsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [models, setModels] = useState<DeviceModel[]>([]);
  const [labors, setLabors] = useState<PartLabor[]>([]);
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
  const [editing, setEditing] = useState<PartLabor | null>(null);
  const { control, register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: {
      serviceId: null,
      brandId: null,
      modelId: null,
      partId: null,
      laborFee: '',
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
        (b.services || []).some(
          (x: any) => x.service && x.service.id === serviceId,
        ),
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
      toast.error(e?.response?.data?.message || 'خطا در دریافت داده‌های پایه اجرت');
    } finally {
      setLoadingBase(false);
    }
  }

  async function loadLabors() {
    setLoading(true);
    try {
      const rl = await client.get('/admin/part-labors', {
        params: {
          serviceId: filterState.serviceId,
          brandId: filterState.brandId,
          modelId: filterState.modelId,
          partId: filterState.partId,
        },
      });

      const raw = rl.data;
      let list: PartLabor[] = [];

      if (Array.isArray(raw)) list = raw;
      else if (raw && Array.isArray(raw.items)) list = raw.items;
      else if (raw && Array.isArray(raw.data)) list = raw.data;
      else if (raw && Array.isArray(raw.results)) list = raw.results;

      setLabors(list);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'خطا در دریافت اجرت‌ها');
    } finally {
      setLoading(false);
    }
  }

  // ===== Effects =====

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    if (!loadingBase) {
      loadLabors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loadingBase,
    filterState.serviceId,
    filterState.brandId,
    filterState.modelId,
    filterState.partId,
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
      laborFee: '',
    });
    (document.getElementById(
      'bp-partlabor-modal-superLongUnique',
    ) as HTMLDialogElement)?.showModal?.();
  }

  function openEditModal(item: PartLabor) {
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
      laborFee: item.laborFee,
    });

    (document.getElementById(
      'bp-partlabor-modal-superLongUnique',
    ) as HTMLDialogElement)?.showModal?.();
  }

  async function onSubmitForm(data: FormValues) {
    try {
      const serviceId = data.serviceId?.value;
      const brandId = data.brandId?.value;
      const modelId = data.modelId?.value;
      const partId = data.partId?.value;
      const laborFeeNumber = Number(data.laborFee);

      if (!serviceId || !partId || !laborFeeNumber || Number.isNaN(laborFeeNumber)) {
        toast.error('سرویس، قطعه و اجرت معتبر الزامی است');
        return;
      }

      const payload = {
        serviceId,
        brandId,
        modelId,
        partId,
        laborFee: laborFeeNumber,
      };

      if (editing) {
        await client.put(`/admin/part-labors/${editing.id}`, payload);
        toast.success('اجرت قطعه با موفقیت ویرایش شد');
      } else {
        await client.post('/admin/part-labors', payload);
        toast.success('اجرت قطعه ثبت شد');
      }

      (document.getElementById(
        'bp-partlabor-modal-superLongUnique',
      ) as HTMLDialogElement)?.close?.();
      loadLabors();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'خطا در ذخیره اجرت قطعه');
    }
  }

  async function handleDeleteLabor(id: number) {
    if (!confirm('از حذف این ردیف اجرت مطمئن هستید؟')) return;
    try {
      await client.delete(`/admin/part-labors/${id}`);
      toast.success('ردیف اجرت حذف شد');
      loadLabors();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'خطا در حذف ردیف اجرت');
    }
  }

  // ===== Dynamic options =====

  const selectedServiceId = watchServiceField?.value;
  const selectedBrandId = watchBrandField?.value;

  const modalBrandOptions = brandOptionsForService(selectedServiceId);
  const modalPartOptions = partOptionsForService(selectedServiceId);
  const modalModelOptions = modelOptionsForBrand(selectedServiceId, selectedBrandId);

  const filterBrandOptions = brandOptionsForService(filterServiceId);
  const filterPartOptions = partOptionsForService(filterServiceId);
  const filterModelOptions = modelOptionsForBrand(filterServiceId, filterBrandId);

  const isLaborsArray = Array.isArray(labors);

  // ===== live search (client side) =====
  const visibleLabors: PartLabor[] = useMemo(() => {
    if (!isLaborsArray) return [];
    const q = filterSearch.trim().toLowerCase();
    if (!q) return labors;

    return labors.filter((row) => {
      const serviceName = row.service?.name || '';
      const brandName = row.brand?.name || '';
      const modelName = row.model?.name || '';
      const partName = row.part?.name || '';

      const combined = `${serviceName} ${brandName} ${modelName} ${partName}`.toLowerCase();
      return combined.includes(q);
    });
  }, [isLaborsArray, labors, filterSearch]);

  function describeScope(row: PartLabor): string {
    if (row.modelId) return 'اجرت مخصوص مدل';
    if (row.brandId) return 'اجرت مخصوص برند';
    return 'اجرت کلی سرویس';
  }

  // ===== Render =====

  return (
    <div className="bp-partlabor-page-root-superLongUniqueClass_01 bp-page-aurora-2025">
      {/* Header */}
      <div className="bp-partlabor-header-superLongUniqueClass_02">
        <div className="bp-partlabor-header-text-superLongUniqueClass_03">
          <h3 className="bp-partlabor-title-superLongUniqueClass_04">اجرت تعویض قطعات</h3>
          <p className="bp-partlabor-subtitle-superLongUniqueClass_05">
            برای هر سرویس و قطعه، اجرت تعویض را تعیین کنید. در صورت نیاز می‌توانید برای برند و مدل خاص اجرت اختصاصی ثبت کنید.
          </p>
        </div>

        <div className="bp-partlabor-header-actions-superLongUniqueClass_06">
          <button
            className="btn btn-secondary bp-partlabor-btn-primary-superLongUniqueClass_07"
            onClick={openCreateModal}
          >
            <Plus className="bp-partlabor-icon-superLongUniqueClass_08" />
            <span>افزودن اجرت جدید</span>
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bp-partlabor-filter-card-superLongUniqueClass_09">
        <div className="bp-partlabor-filter-header-superLongUniqueClass_10">
          <div className="bp-partlabor-filter-title-block-superLongUniqueClass_11">
            <Filter className="bp-partlabor-icon-muted-superLongUniqueClass_12" />
            <div>
              <div className="bp-partlabor-filter-title-superLongUniqueClass_13">
                فیلتر اجرت قطعات
              </div>
              <div className="bp-partlabor-filter-caption-superLongUniqueClass_14">
                بر اساس سرویس، برند، مدل و قطعه لیست اجرت‌ها را محدود کنید.
              </div>
            </div>
          </div>
          <div className="bp-partlabor-filter-actions-top-superLongUniqueClass_15">
            <button
              className="btn btn-ghost bp-partlabor-btn-ghost-superLongUniqueClass_16"
              onClick={handleClearFilter}
            >
              پاک‌کردن فیلترها
            </button>
            <button
              className="btn btn-primary bp-partlabor-btn-apply-superLongUniqueClass_17"
              onClick={handleApplyFilter}
            >
              اعمال فیلتر
            </button>
          </div>
        </div>

        <div className="bp-partlabor-filter-grid-superLongUniqueClass_18">
          <div className="bp-partlabor-filter-field-superLongUniqueClass_19">
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

          <div className="bp-partlabor-filter-field-superLongUniqueClass_19">
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

          <div className="bp-partlabor-filter-field-superLongUniqueClass_19">
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

          <div className="bp-partlabor-filter-field-superLongUniqueClass_19">
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

          <div className="bp-partlabor-filter-field-span-superLongUniqueClass_20">
            <label>جستجو (نام سرویس / برند / مدل / قطعه)</label>
            <div className="bp-partlabor-search-wrapper-superLongUniqueClass_21">
              <Search className="bp-partlabor-search-icon-superLongUniqueClass_22" />
              <input
                className="bp-partlabor-search-input-superLongUniqueClass_23"
                placeholder="مثلاً: LCD سامسونگ A12 ..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bp-partlabor-list-wrapper-superLongUniqueClass_24">
        {loadingBase ? (
          <div className="bp-partlabor-loading-superLongUniqueClass_25">
            در حال بارگذاری داده‌های پایه...
          </div>
        ) : loading ? (
          <div className="bp-partlabor-loading-superLongUniqueClass_25">
            در حال بارگذاری لیست اجرت‌ها...
          </div>
        ) : !isLaborsArray || visibleLabors.length === 0 ? (
          <div className="bp-partlabor-empty-state-superLongUniqueClass_26">
            <p>هیچ ردیف اجرتی مطابق فیلترها / جستجو یافت نشد.</p>
            <button
              className="btn btn-secondary bp-partlabor-btn-primary-superLongUniqueClass_07"
              onClick={openCreateModal}
            >
              ثبت اولین اجرت قطعه
            </button>
          </div>
        ) : (
          <div className="bp-partlabor-table-container-superLongUniqueClass_27">
            <table className="bp-partlabor-table-superLongUniqueClass_28">
              <thead>
                <tr>
                  <th>سرویس</th>
                  <th>قطعه</th>
                  <th>برند</th>
                  <th>مدل</th>
                  <th>نوع اجرت</th>
                  <th>اجرت (تومان)</th>
                  <th>آخرین بروزرسانی</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {visibleLabors.map((row) => (
                  <tr key={row.id}>
                    <td>{row.service?.name || `#${row.serviceId}`}</td>
                    <td>{row.part?.name || `#${row.partId}`}</td>
                    <td>{row.brand?.name || (row.brandId ? `#${row.brandId}` : '-')}</td>
                    <td>{row.model?.name || (row.modelId ? `#${row.modelId}` : '-')}</td>
                    <td>{describeScope(row)}</td>
                    <td>{row.laborFee.toLocaleString('fa-IR')}</td>
                    <td>{new Date(row.updatedAt).toLocaleString('fa-IR')}</td>
                    <td>
                      <div className="bp-partlabor-row-actions-superLongUniqueClass_29">
                        <button
                          className="bp-partlabor-icon-btn-edit-superLongUniqueClass_30"
                          onClick={() => openEditModal(row)}
                          title="ویرایش"
                        >
                          <Edit className="bp-partlabor-icon-superLongUniqueClass_08" />
                        </button>
                        <button
                          className="bp-partlabor-icon-btn-remove-superLongUniqueClass_31"
                          onClick={() => handleDeleteLabor(row.id)}
                          title="حذف"
                        >
                          <Trash2 className="bp-partlabor-icon-superLongUniqueClass_08" />
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
      <dialog
        id="bp-partlabor-modal-superLongUnique"
        className="bp-partlabor-modal-superLongUniqueClass_32"
      >
        <form
          className="bp-partlabor-form-superLongUniqueClass_33"
          onSubmit={handleSubmit(onSubmitForm)}
          method="dialog"
        >
          <div className="bp-partlabor-form-header-superLongUniqueClass_34">
            <h4>{editing ? 'ویرایش اجرت قطعه' : 'ثبت اجرت جدید برای قطعه'}</h4>
            <button
              type="button"
              className="btn btn-ghost bp-partlabor-btn-ghost-superLongUniqueClass_16"
              onClick={() =>
                (document.getElementById(
                  'bp-partlabor-modal-superLongUnique',
                ) as HTMLDialogElement).close()
              }
            >
              بستن
            </button>
          </div>

          <div className="bp-partlabor-form-body-superLongUniqueClass_35">
            {/* Service */}
            <div className="bp-partlabor-form-row-superLongUniqueClass_36">
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
            <div className="bp-partlabor-form-row-superLongUniqueClass_36">
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
            <div className="bp-partlabor-form-row-superLongUniqueClass_36">
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
            <div className="bp-partlabor-form-row-superLongUniqueClass_36">
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

            {/* labor fee */}
            <div className="bp-partlabor-form-row-superLongUniqueClass_36">
              <label>اجرت تعویض (تومان)</label>
              <input
                type="number"
                min={0}
                step={1000}
                className="bp-partlabor-input-superLongUniqueClass_37"
                {...register('laborFee', { required: true })}
                placeholder="مثلاً 1000000"
              />
            </div>
          </div>

          <div className="bp-partlabor-form-footer-superLongUniqueClass_38">
            <button
              type="button"
              className="btn btn-ghost bp-partlabor-btn-ghost-superLongUniqueClass_16"
              onClick={() =>
                (document.getElementById(
                  'bp-partlabor-modal-superLongUnique',
                ) as HTMLDialogElement).close()
              }
            >
              انصراف
            </button>
            <button
              type="submit"
              className="btn btn-primary bp-partlabor-btn-primary-superLongUniqueClass_07"
              disabled={loadingBase}
            >
              {editing ? 'ذخیره تغییرات' : 'ثبت اجرت'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
