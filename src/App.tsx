/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { DeliveryPortal } from './pages/DeliveryPortal';
import { DriveConnect } from './pages/DriveConnect';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { CreatorLogin } from './pages/CreatorLogin';
import { CustomerSignup } from './pages/CustomerSignup';
import { ActiveLinks } from './pages/ActiveLinks';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/creator-login" element={<CreatorLogin />} />
        <Route path="/customer-signup" element={<CustomerSignup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/links" element={<ActiveLinks />} />
        <Route path="/dashboard/analytics" element={<Analytics />} />
        <Route path="/dashboard/drive" element={<DriveConnect />} />
        <Route path="/dashboard/settings" element={<Settings />} />
        <Route path="/portal/:id" element={<DeliveryPortal />} />
      </Routes>
    </Router>
  );
}
