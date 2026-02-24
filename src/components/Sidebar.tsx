import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiSettings, FiPackage, FiPhone, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import clsx from 'clsx';

const NavItem: React.FC<{ to: string; label: string; icon?: React.ReactNode; indent?: boolean }> = ({
  to,
  label,
  icon,
  indent,
}) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'bp-sticky-sidebar-navitem-2025',
          isActive && 'bp-sticky-sidebar-navitem-2025--active',
          indent && 'bp-sticky-sidebar-navitem-2025--indent',
        )
      }
    >
      <div className="bp-sticky-sidebar-icon-2025">{icon}</div>
      <div className="bp-sticky-sidebar-label-2025">{label}</div>
    </NavLink>
  );
};

export default function Sidebar() {
  const [callsOpen, setCallsOpen] = useState(true);

  return (
    <div className="bp-sticky-sidebar-panel-2025">
      <div className="bp-sticky-sidebar-brand-2025">
        <div className="bp-sticky-sidebar-logo-2025">B</div>
        <div className="bp-sticky-sidebar-brand-text-2025">
          <div className="bp-sticky-sidebar-brand-title-2025">Bartar Service</div>
          <div className="bp-sticky-sidebar-brand-sub-2025">برتر سرویس</div>
        </div>
      </div>

      <div className="bp-sticky-sidebar-scroll-2025">
        <nav className="bp-sticky-sidebar-nav-2025">
          <NavItem to="/" label="پیشخوان" icon={<FiGrid />} />
          <NavItem to="/admin/services" label="سرویس ها" icon={<FiSettings />} />
          <NavItem to="/admin/brands" label="برندها" icon={<FiPackage />} />
          <NavItem to="/admin/models" label="مدل ها" icon={<FiPackage />} />
          <NavItem to="/admin/problem" label="مشکلات" icon={<FiPackage />} />
          <NavItem to="/admin/parts" label="قطعات" icon={<FiPackage />} />
          <NavItem to="/admin/part-prices" label="قیمت قطعات" icon={<FiPackage />} />
          <NavItem to="/admin/part-labors" label="اجرت قطعات" icon={<FiPackage />} />
          <NavItem to="/admin/pricing-config" label="تنظیم قیمت" icon={<FiSettings />} />
          <NavItem to="/admin/problem-part-mapping" label="ثبت مشکل قطعه" icon={<FiPackage />} />
          <NavItem to="/admin/users" label="کاربران" icon={<FiPackage />} />
          <NavItem to="/admin/orders" label="سفارشات" icon={<FiPackage />} />
          <NavItem to="/admin/technician" label="تکنسین ها" icon={<FiPackage />} />

          {/* Calls accordion */}
          <button
            type="button"
            onClick={() => setCallsOpen((v) => !v)}
            className={clsx('bp-sticky-sidebar-navitem-2025', 'bp-sticky-sidebar-navitem-2025--accordion')}
          >
            <div className="bp-sticky-sidebar-icon-2025">
              <FiPhone />
            </div>
            <div className="bp-sticky-sidebar-label-2025">ثبت تماس‌ها</div>
            <div className="bp-sticky-sidebar-accordion-caret-2025">
              {callsOpen ? <FiChevronDown /> : <FiChevronRight />}
            </div>
          </button>

          {callsOpen && (
            <>
              <NavItem to="/admin/calls/new" label="ثبت تماس جدید" icon={<span />} indent />
              <NavItem to="/admin/calls/history" label="تاریخچه" icon={<span />} indent />
              <NavItem to="/admin/calls/reports" label="گزارش" icon={<span />} indent />
            </>
          )}
        </nav>
      </div>

      <div className="bp-sticky-sidebar-foot-2025">
        <div className="bp-sticky-sidebar-footnote-2025">bartar sevice</div>
      </div>
    </div>
  );
}