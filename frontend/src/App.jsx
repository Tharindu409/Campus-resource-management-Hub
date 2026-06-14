import './index.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppProvider } from './context/AppContext';
import { UserProvider } from './context/UserContext';
import AppRoutes from './routes/AppRoutes.jsx';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <UserProvider>
          <AppProvider>
            <div className="min-h-screen font-sans text-[var(--text-primary)] bg-transparent">
              <main>
                <AppRoutes />
              </main>

              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#ffffff',
                    color: '#111827',
                    border: '1px solid #e5e7eb',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '12px',
                    fontSize: '14px',
                  },
                  success: {
                    iconTheme: { primary: '#f97316', secondary: 'transparent' },
                  },
                  error: {
                    iconTheme: { primary: '#f87171', secondary: 'transparent' },
                  },
                }}
              />
            </div>
          </AppProvider>
        </UserProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
