import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider.tsx'
import RequireAuth from './auth/RequireAuth.tsx'
import AcceptInvite from './pages/AcceptInvite.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Home from './pages/Home.tsx'
import InvitePartner from './pages/InvitePartner.tsx'
import NotFound from './pages/NotFound.tsx'
import Setup from './pages/Setup.tsx'
import SignIn from './pages/SignIn.tsx'
import SignUp from './pages/SignUp.tsx'

// Development-only reference page; the condition is compiled away so production builds don't include it.
const StyleGuide = import.meta.env.DEV ? lazy(() => import('./pages/StyleGuide.tsx')) : null

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <a href="#main" className="skip-link">Skip to content</a>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/partner/accept/:token" element={<AcceptInvite />} />
          <Route element={<RequireAuth />}>
            <Route path="/partner" element={<InvitePartner />} />
            <Route path="/app" element={<Dashboard />} />
            <Route path="/app/setup/:step?" element={<Setup />} />
          </Route>
          {StyleGuide && (
            <Route
              path="/styleguide"
              element={
                <Suspense fallback={null}>
                  <StyleGuide />
                </Suspense>
              }
            />
          )}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
