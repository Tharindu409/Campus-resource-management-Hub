import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

// Auth Pages
import LoginPage from '../pages/LoginPage';
import AuthCallbackPage from '../pages/AuthCallbackPage';
import LocalLoginPage from '../pages/LocalLoginPage';
import SignUpPage from '../pages/SignUpPage';
import DashboardPage from '../pages/DashboardPage';
import NotificationsPage from '../pages/NotificationsPage';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Shared UI
import Navbar from '../components/Navbar';

// Booking Pages
import CreateBookingPage from '../pages/CreateBookingPage';
import MyBookingsPage from '../pages/MyBookingsPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import ResourceCalendarPage from '../pages/ResourceCalendarPage';

// Resource Pages
import ResourcePage from '../pages/ResourcePage';

// Ticket Pages
import { AdminPanelPage } from '../pages/adminpanel';
import { CreateTicketPage } from '../pages/createticket';
import { MyTicketsPage } from '../pages/myticket';
import { TechnicianPanelPage } from '../pages/technicianpanel';
import { TicketDetailsPage } from '../pages/ticketDetails';
import UserManagement from '../pages/UserManagement';

export default function AppRoutes() {
  const { currentUser } = useUser();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/local" element={<LocalLoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Protected Routes with Navbar */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute requiredRole="ROLE_ADMIN">
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  {/* Default Redirect */}
                  <Route
                    path="/"
                    element={
                      <Navigate
                        to={
                          currentUser?.role === 'ADMIN' || currentUser?.role === 'ROLE_ADMIN' 
                            ? '/admin-dashboard' 
                            : (currentUser?.role === 'TECHNICIAN' || currentUser?.role === 'ROLE_TECHNICIAN' ? '/technician' : '/dashboard')
                        }
                        replace
                      />
                    }
                  />

                  {/* Dashboard & Notifications */}
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />

                  {/* Booking Routes */}
                  <Route path="/create" element={<CreateBookingPage />} />
                  <Route path="/create-booking" element={<CreateBookingPage />} />
                  <Route path="/my-bookings" element={<MyBookingsPage />} />
                  <Route path="/calendar" element={<ResourceCalendarPage />} />

                  {/* Resource Route */}
                  <Route path="/resources" element={<ResourcePage />} />

                  {/* Ticket Routes */}
                  <Route path="/my-tickets" element={<MyTicketsPage />} />
                  <Route path="/create-ticket" element={<CreateTicketPage />} />
                  <Route path="/tickets/:id" element={<TicketDetailsPage />} />
                  <Route
                    path="/technician"
                    element={
                      <ProtectedRoute requiredRoles={['ROLE_TECHNICIAN', 'ROLE_ADMIN']}>
                        <TechnicianPanelPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requiredRole="ROLE_ADMIN">
                        <AdminPanelPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute requiredRole="ROLE_ADMIN">
                        <UserManagement />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}