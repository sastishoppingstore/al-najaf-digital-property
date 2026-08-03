import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HomePage } from '@/pages/HomePage';
import { PropertiesPage } from '@/pages/PropertiesPage';
import { PropertyDetailPage } from '@/pages/PropertyDetailPage';
import { ServicesPage } from '@/pages/ServicesPage';
import { ServiceDetailPage } from '@/pages/ServiceDetailPage';
import { LawyersPage } from '@/pages/LawyersPage';
import { LegalDocumentsPage } from '@/pages/legal/LegalDocumentsPage';
import { LegalDocDetailPage } from '@/pages/legal/LegalDocDetailPage';
import { FardPage } from '@/pages/legal/FardPage';
import { FardDetailPage } from '@/pages/legal/FardDetailPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { VerifyOtpPage } from '@/pages/auth/VerifyOtpPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { PostAdPage } from '@/pages/PostAdPage';
import { MegaSearchPage } from '@/pages/MegaSearchPage';
import { CapitalValleyPage } from '@/pages/CapitalValleyPage';
import { CalculatorPage } from '@/pages/CalculatorPage';
import { EStampPage } from '@/pages/EStampPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AdminPage } from '@/pages/AdminPage';
import { DcRateCheckPage } from '@/pages/DcRateCheckPage';
import { IslamicInheritanceCalculatorPage } from '@/pages/IslamicInheritanceCalculatorPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { BranchesPage } from '@/pages/BranchesPage';
import { ArticlesPage } from '@/pages/ArticlesPage';
import { ArticleDetailPage } from '@/pages/ArticleDetailPage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/*" element={<SiteLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<MegaSearchPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/property/:id" element={<PropertyDetailPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:id" element={<ServiceDetailPage />} />
          <Route path="/lawyers" element={<LawyersPage />} />
          <Route path="/legal" element={<LegalDocumentsPage />} />
          <Route path="/legal/:id" element={<LegalDocDetailPage />} />
          <Route path="/fard" element={<FardPage />} />
          <Route path="/fard/:id" element={<FardDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/post-ad" element={<PostAdPage />} />
          <Route path="/capital-valley" element={<CapitalValleyPage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/estamp" element={<EStampPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:slug" element={<ArticleDetailPage />} />
          <Route path="/dc-rate-check" element={<DcRateCheckPage />} />
          <Route path="/islamic-inheritance-calculator" element={<IslamicInheritanceCalculatorPage />} />
          <Route path="/branches" element={<BranchesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);
  return null;
}
