import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider.tsx'
import RequireAuth from './auth/RequireAuth.tsx'
import AcceptInvite from './pages/AcceptInvite.tsx'
import Dashboard from './pages/Dashboard.tsx'
import DashboardLayout from './pages/DashboardLayout.tsx'
import Home from './pages/Home.tsx'
import InvitePartner from './pages/InvitePartner.tsx'
import NotFound from './pages/NotFound.tsx'
import Setup from './pages/Setup.tsx'
import SignIn from './pages/SignIn.tsx'
import SignUp from './pages/SignUp.tsx'

// Invitation pages load their own fonts and styles, so they're split out of the main bundle.
const Invitation = lazy(() => import('./pages/Invitation.tsx'))
const EditRsvp = lazy(() => import('./pages/EditRsvp.tsx'))
const Design = lazy(() => import('./pages/Design.tsx'))
const Responses = lazy(() => import('./pages/Responses.tsx'))
const Share = lazy(() => import('./pages/Share.tsx'))

// Development-only reference page; the condition is compiled away so production builds don't include it.
const StyleGuide = import.meta.env.DEV ? lazy(() => import('./pages/StyleGuide.tsx')) : null

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <a href="#main" className="skip-link">Skip to content</a>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/partner/accept/:token" element={<AcceptInvite />} />
            <Route path="/invite/:slug" element={<Invitation />} />
            <Route path="/rsvp/:token" element={<EditRsvp />} />
            <Route element={<RequireAuth />}>
              <Route path="/partner" element={<InvitePartner />} />
              <Route path="/app" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="responses" element={<Responses />} />
                <Route path="share" element={<Share />} />
              </Route>
              <Route path="/app/setup/:step?" element={<Setup />} />
              <Route path="/app/design" element={<Design />} />
            </Route>
            {StyleGuide && <Route path="/styleguide" element={<StyleGuide />} />}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
