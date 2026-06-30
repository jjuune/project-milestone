import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import VehicleCardPage from './pages/VehicleCardPage'
import VehicleWalletPage from './pages/VehicleWalletPage'
import './App.css'

// 로그인 안 된 상태면 로그인 화면으로 돌려보내는 가드
function RequireAuth({ children }) {
  const { session, loading } = useAuth()

  if (loading) {
    // 저장된 세션(Refresh Token) 확인 중 — 짧은 순간 깜빡임 방지용 로딩 상태
    return <div className="app-loading">불러오는 중...</div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppRoutes() {
  const { session } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/vehicle/:id"
        element={
          <RequireAuth>
            <VehicleCardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/vehicle/:id/wallet"
        element={
          <RequireAuth>
            <VehicleWalletPage />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
