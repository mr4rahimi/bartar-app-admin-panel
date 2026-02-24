// D:\projects\bartar-app\admin-panel\src\pages\admin\ProblemPartMappingPage.tsx
import { useEffect, useMemo, useState } from 'react';
import client from '../../api/client';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { Search, Link as LinkIcon, Plug, Trash2 } from 'lucide-react';

type OptionType = { value: number; label: string };

type Service = { id: number; name: string; slug?: string };

type Part = {
  id: number;
  name: string;
  serviceId: number;
};

type Problem = {
  id: number;
  name: string;
  slug?: string;
  serviceId: number;
  partId?: number | null;
  service?: { id: number; name: string };
  part?: { id: number; name: string };
};

export default function ProblemPartMappingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loadingBase, setLoadingBase] = useState(true);
  const [loading, setLoading] = useState(false);

  const [filterServiceId, setFilterServiceId] = useState<number | undefined>();
  const [searchText, setSearchText] = useState('');

  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [selectedPartOption, setSelectedPartOption] = useState<OptionType | null>(null);
  const [savingMapping, setSavingMapping] = useState(false);

  // ===== Base loaders =====

  async function loadBaseData() {
    try {
      setLoadingBase(true);
      const [rs, rparts, rproblems] = await Promise.all([
        client.get('/admin/services'),
        client.get('/admin/parts'),
        client.get('/admin/problems'),
      ]);

      setServices(rs.data || []);
      setParts(Array.isArray(rparts.data) ? rparts.data : []);
      setProblems(Array.isArray(rproblems.data) ? rproblems.data : []);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'خطا در دریافت داده‌های پایه ثبت مشکل به قطعه');
    } finally {
      setLoadingBase(false);
    }
  }

  useEffect(() => {
    loadBaseData();
  }, []);

  // ===== Helpers =====

  const serviceOptions: OptionType[] = services.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  function partsForService(serviceId: number | undefined): OptionType[] {
    if (!serviceId) return [];
    return parts
      .filter((p) => p.serviceId === serviceId)
      .map((p) => ({ value: p.id, label: p.name }));
  }

  // لیست قابل نمایش با فیلتر سرویس + سرچ زنده
  const visibleProblems: Problem[] = useMemo(() => {
    let list = problems;

    if (filterServiceId) {
      list = list.filter((p) => p.serviceId === filterServiceId);
    }

    const q = searchText.trim().toLowerCase();
    if (!q) return list;

    return list.filter((p) => {
      const problemName = p.name || '';
      const serviceName =
        p.service?.name || services.find((s) => s.id === p.serviceId)?.name || '';
      const partName =
        p.part?.name ||
        (p.partId
          ? parts.find((x) => x.id === p.partId)?.name || ''
          : '');

      const combined = `${problemName} ${serviceName} ${partName}`.toLowerCase();
      return combined.includes(q);
    });
  }, [problems, filterServiceId, searchText, services, parts]);

  function getServiceName(problem: Problem): string {
    return (
      problem.service?.name ||
      services.find((s) => s.id === problem.serviceId)?.name ||
      `#${problem.serviceId}`
    );
  }

  function getPartName(problem: Problem): string {
    if (!problem.partId) return 'قطعه‌ای تعیین نشده';
    return (
      problem.part?.name ||
      parts.find((p) => p.id === problem.partId)?.name ||
      `#${problem.partId}`
    );
  }

  function getMappingStatus(problem: Problem): string {
    if (!problem.partId) return 'بدون قطعه (قیمت پایه ۰)';
    return 'دارای قطعه (قیمت بر اساس قطعه)';
  }

  function openMappingModal(problem: Problem) {
    setSelectedProblem(problem);
    const serviceId = problem.serviceId;
    const partOpts = partsForService(serviceId);
    const currentPartOpt =
      problem.partId != null
        ? partOpts.find((p) => p.value === problem.partId) || null
        : null;
    setSelectedPartOption(currentPartOpt);

    (document.getElementById(
      'bp-problem-partmapping-modal-superLongUnique',
    ) as HTMLDialogElement)?.showModal?.();
  }

  function closeMappingModal() {
    (document.getElementById(
      'bp-problem-partmapping-modal-superLongUnique',
    ) as HTMLDialogElement)?.close?.();
    setSelectedProblem(null);
    setSelectedPartOption(null);
  }

  // ذخیره ثبت (یک قطعه برای این مشکل)
  async function handleSaveMapping() {
    if (!selectedProblem) return;
    if (!selectedPartOption) {
      toast.error('لطفاً یک قطعه انتخاب کنید');
      return;
    }

    try {
      setSavingMapping(true);

      // فقط partId را ارسال می‌کنیم؛ بک‌اند باید این را قبول کند.
      const payload = {
        partId: selectedPartOption.value,
      };

      await client.put(`/admin/problems/${selectedProblem.id}`, payload);

      // در state محلی هم آپدیت کنیم
      setProblems((prev) =>
        prev.map((p) =>
          p.id === selectedProblem.id
            ? { ...p, partId: selectedPartOption.value, part: { id: selectedPartOption.value, name: selectedPartOption.label } }
            : p,
        ),
      );

      toast.success('ثبت قطعه به مشکل با موفقیت ذخیره شد');
      closeMappingModal();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'خطا در ذخیره ثبت قطعه برای این مشکل');
    } finally {
      setSavingMapping(false);
    }
  }

  // حذف ثبت (مشکل بدون قطعه → قیمت پایه ۰)
  async function handleClearMapping(problem: Problem) {
    if (!problem.partId) return;
    if (!confirm('از حذف ثبت قطعه این مشکل مطمئن هستید؟')) return;

    try {
      setLoading(true);
      const payload = { partId: null };
      await client.put(`/admin/problems/${problem.id}`, payload);

      setProblems((prev) =>
        prev.map((p) =>
          p.id === problem.id ? { ...p, partId: null, part: undefined } : p,
        ),
      );
      toast.success('ثبت قطعه برای این مشکل حذف شد (قیمت پایه ۰)');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'خطا در حذف ثبت قطعه');
    } finally {
      setLoading(false);
    }
  }

  const modalPartOptions = partsForService(selectedProblem?.serviceId);

  // ===== Render =====

  return (
    <div className="bp-problem-partmap-root-superLongUnique_200 bp-page-aurora-2025">
      {/* Header */}
      <div className="bp-problem-partmap-header-superLongUnique_201">
        <div className="bp-problem-partmap-header-text-superLongUnique_202">
          <h3 className="bp-problem-partmap-title-superLongUnique_203">
            ثبت مشکلات به قطعات
          </h3>
          <p className="bp-problem-partmap-subtitle-superLongUnique_204">
            برای هر مشکل می‌توانید حداکثر یک قطعه تعیین کنید. مشکلاتی که قطعه ندارند،
            در محاسبه قیمت پایه با مقدار ۰ (فقط در نظر گرفتن اجرت کلی / بدون قطعه)
            محاسبه خواهند شد.
          </p>
        </div>
      </div>

      {/* Filter card */}
      <div className="bp-problem-partmap-filter-card-superLongUnique_205">
        <div className="bp-problem-partmap-filter-header-superLongUnique_206">
          <div className="bp-problem-partmap-filter-titleblock-superLongUnique_207">
            <Plug className="bp-problem-partmap-icon-muted-superLongUnique_208" />
            <div>
              <div className="bp-problem-partmap-filter-title-superLongUnique_209">
                فیلتر مشکلات و ثبت‌ها
              </div>
              <div className="bp-problem-partmap-filter-caption-superLongUnique_210">
                می‌توانید بر اساس سرویس و متن جستجو (نام مشکل / نام قطعه) لیست را محدود کنید.
              </div>
            </div>
          </div>
        </div>

        <div className="bp-problem-partmap-filter-grid-superLongUnique_211">
          <div className="bp-problem-partmap-filter-field-superLongUnique_212">
            <label>سرویس</label>
            <Select
              classNamePrefix="react-select"
              placeholder="همه سرویس‌ها"
              isClearable
              options={serviceOptions}
              value={
                filterServiceId
                  ? serviceOptions.find((s) => s.value === filterServiceId) || null
                  : null
              }
              onChange={(opt) => setFilterServiceId(opt?.value)}
              isDisabled={loadingBase}
            />
          </div>

          <div className="bp-problem-partmap-filter-field-span-superLongUnique_213">
            <label>جستجو (نام مشکل / نام قطعه)</label>
            <div className="bp-problem-partmap-search-wrapper-superLongUnique_214">
              <Search className="bp-problem-partmap-search-icon-superLongUnique_215" />
              <input
                className="bp-problem-partmap-search-input-superLongUnique_216"
                placeholder="مثلاً: تعویض ال‌سی‌دی، شکستگی شیشه، باطری ..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bp-problem-partmap-list-wrapper-superLongUnique_217">
        {loadingBase ? (
          <div className="bp-problem-partmap-loading-superLongUnique_218">
            در حال بارگذاری داده‌ها...
          </div>
        ) : visibleProblems.length === 0 ? (
          <div className="bp-problem-partmap-empty-superLongUnique_219">
            <p>مشکلی مطابق فیلترهای فعلی یافت نشد.</p>
          </div>
        ) : (
          <div className="bp-problem-partmap-table-container-superLongUnique_220">
            <table className="bp-problem-partmap-table-superLongUnique_221">
              <thead>
                <tr>
                  <th>مشکل</th>
                  <th>سرویس</th>
                  <th>قطعه ثبت‌شده</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {visibleProblems.map((problem) => (
                  <tr key={problem.id}>
                    <td>{problem.name}</td>
                    <td>{getServiceName(problem)}</td>
                    <td>{getPartName(problem)}</td>
                    <td>
                      <span
                        className={
                          problem.partId
                            ? 'bp-problem-partmap-badge-haspart-superLongUnique_222'
                            : 'bp-problem-partmap-badge-nopart-superLongUnique_223'
                        }
                      >
                        {getMappingStatus(problem)}
                      </span>
                    </td>
                    <td>
                      <div className="bp-problem-partmap-row-actions-superLongUnique_224">
                        <button
                          className="bp-problem-partmap-btn-map-superLongUnique_225"
                          type="button"
                          onClick={() => openMappingModal(problem)}
                          title="انتخاب / تغییر قطعه"
                        >
                          <LinkIcon className="bp-problem-partmap-icon-small-superLongUnique_226" />
                          <span>انتخاب قطعه</span>
                        </button>
                        {problem.partId && (
                          <button
                            className="bp-problem-partmap-btn-clear-superLongUnique_227"
                            type="button"
                            onClick={() => handleClearMapping(problem)}
                            title="حذف ثبت قطعه"
                            disabled={loading}
                          >
                            <Trash2 className="bp-problem-partmap-icon-small-superLongUnique_226" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: انتخاب قطعه برای یک مشکل */}
      <dialog
        id="bp-problem-partmapping-modal-superLongUnique"
        className="bp-problem-partmap-modal-superLongUnique_228"
      >
        <form
          className="bp-problem-partmap-modal-form-superLongUnique_229"
          method="dialog"
          onSubmit={(e) => {
            e.preventDefault();
            if (!savingMapping) handleSaveMapping();
          }}
        >
          <div className="bp-problem-partmap-modal-header-superLongUnique_230">
            <div>
              <h4>انتخاب قطعه برای مشکل</h4>
              {selectedProblem && (
                <p>
                  مشکل: <strong>{selectedProblem.name}</strong> (سرویس:{' '}
                  <span>{getServiceName(selectedProblem)}</span>)
                </p>
              )}
            </div>
            <button
              type="button"
              className="btn btn-ghost bp-problem-partmap-modal-btn-ghost-superLongUnique_231"
              onClick={closeMappingModal}
            >
              بستن
            </button>
          </div>

          <div className="bp-problem-partmap-modal-body-superLongUnique_232">
            <div className="bp-problem-partmap-modal-row-superLongUnique_233">
              <label>قطعه مرتبط با این مشکل</label>
              <Select
                classNamePrefix="react-select"
                placeholder={
                  selectedProblem
                    ? 'انتخاب قطعه برای این مشکل...'
                    : 'ابتدا یک مشکل را انتخاب کنید'
                }
                isDisabled={!selectedProblem || modalPartOptions.length === 0}
                options={modalPartOptions}
                value={selectedPartOption}
                onChange={(opt) => setSelectedPartOption(opt)}
              />
              <p className="bp-problem-partmap-modal-help-superLongUnique_234">
                برای هر مشکل فقط <strong>یک قطعه</strong> می‌توانید تعریف کنید. در صورت
                عدم انتخاب قطعه، قیمت پایه این مشکل ۰ در نظر گرفته خواهد شد.
              </p>
            </div>
          </div>

          <div className="bp-problem-partmap-modal-footer-superLongUnique_235">
            <button
              type="button"
              className="btn btn-ghost bp-problem-partmap-modal-btn-ghost-superLongUnique_231"
              onClick={closeMappingModal}
            >
              انصراف
            </button>
            <button
              type="submit"
              className="btn btn-primary bp-problem-partmap-modal-btn-primary-superLongUnique_236"
              disabled={savingMapping || !selectedPartOption}
            >
              {savingMapping ? 'در حال ذخیره...' : 'ذخیره ثبت'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
