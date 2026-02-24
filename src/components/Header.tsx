import { FiBell } from 'react-icons/fi';

export default function Header() {
  return (
    <header className="bp-header-aurora-2025">
      <div className="bp-header-aurora-2025__card">
        <div className="bp-header-aurora-2025__title-group">
          <h1 className="bp-header-aurora-2025__title">پنل ادمین برتر سرویس</h1>
        </div>

        <div className="bp-header-aurora-2025__actions">
          <button title="برتر" className="bp-header-aurora-2025__icon-btn">
            <FiBell className="bp-header-aurora-2025__icon" />
            <span className="bp-header-aurora-2025__badge">3</span>
          </button>

          <div className="bp-header-aurora-2025__user">
            <div className="bp-header-aurora-2025__user-name">admin</div>
            <div className="bp-header-aurora-2025__avatar">B</div>
          </div>
        </div>
      </div>
    </header>
  );
}
