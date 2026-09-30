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
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '12px',
                    fontSize: '14px',
                  },
                  success: {
                    iconTheme: { primary: 'var(--success)', secondary: 'transparent' },
                  },
                  error: {
                    iconTheme: { primary: 'var(--danger)', secondary: 'transparent' },
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
