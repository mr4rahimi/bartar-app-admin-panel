import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import { Routes, Route } from 'react-router-dom';
import ServicesPage from './pages/admin/ServicesPage';
import BrandsPage from './pages/admin/BrandsPage';
import ModelsPage from './pages/admin/ModelsPage';
import ProblemPage from './pages/admin/ProblemPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './auth/ProtectedRoute';
import UsersPage from './pages/admin/UsersPage';
import OrdersPage from './pages/admin/OrdersPage';
import TechniciansPage from './pages/admin/TechniciansPage';
import PartsPage from './pages/admin/PartsPage';
import PartPricesPage from './pages/admin/PartPricesPage';
import PartLaborsPage from './pages/admin/PartLaborsPage';
import PricingConfigPage from './pages/admin/PricingConfigPage';
import ProblemPartMappingPage from './pages/admin/ProblemPartMappingPage';
mport CallLogsNewPage from './pages/admin/CallLogsNewPage';
import CallLogsHistoryPage from './pages/admin/CallLogsHistoryPage';
import CallLogsReportsPage from './pages/admin/CallLogsReportsPage';

export default function App() {
  return (
    <div className="app-shell">
      <div className="main-area">
        <aside className="bp-sticky-sidebar-shell-2025">
          <Sidebar />
        </aside>

        <div className="bp-main-stack-2025">
          <Header />
          <main className="content">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/admin/services" element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
                <Route path="/admin/brands" element={<ProtectedRoute><BrandsPage /></ProtectedRoute>} />
                <Route path="/admin/models" element={<ProtectedRoute><ModelsPage /></ProtectedRoute>} />
                <Route path="/admin/problem" element={<ProtectedRoute><ProblemPage /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute><UsersPage/></ProtectedRoute>} />
                <Route path="/admin/technician" element={<ProtectedRoute><TechniciansPage/></ProtectedRoute>} />
                <Route path="/admin/orders" element={<ProtectedRoute><OrdersPage/></ProtectedRoute>} />
                <Route path="/admin/parts" element={<ProtectedRoute><PartsPage /></ProtectedRoute>} />
                <Route path="/admin/part-prices" element={<ProtectedRoute><PartPricesPage /></ProtectedRoute>} />
                <Route path="/admin/part-labors"element={<ProtectedRoute><PartLaborsPage /></ProtectedRoute>} />
                <Route path="/admin/pricing-config"element={<ProtectedRoute><PricingConfigPage /></ProtectedRoute>} />
                <Route path="/admin/problem-part-mapping"element={<ProtectedRoute><ProblemPartMappingPage /></ProtectedRoute>} />
                <Route path="/admin/calls/new" element={<ProtectedRoute><CallLogsNewPage /></ProtectedRoute>} />
                <Route path="/admin/calls/history" element={<ProtectedRoute><CallLogsHistoryPage /></ProtectedRoute>} />
                <Route path="/admin/calls/reports" element={<ProtectedRoute><CallLogsReportsPage /></ProtectedRoute>} />

              </Routes>

            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
