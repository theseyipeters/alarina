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
const Studio = lazy(() => import('./pages/Studio.tsx'))
const Responses = lazy(() => import('./pages/Responses.tsx'))
const Share = lazy(() => import('./pages/Share.tsx'))
const Gifts = lazy(() => import('./pages/Gifts.tsx'))
const CashGifts = lazy(() => import('./pages/CashGifts.tsx'))
const AsoEbi = lazy(() => import('./pages/AsoEbi.tsx'))
const Wishlist = lazy(() => import('./pages/Wishlist.tsx'))
const GiftResult = lazy(() => import('./pages/GiftResult.tsx'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.tsx'))
const ResetPassword = lazy(() => import('./pages/ResetPassword.tsx'))
const Marketplace = lazy(() => import('./pages/Marketplace.tsx'))
const VendorPage = lazy(() => import('./pages/VendorPage.tsx'))
const Vendors = lazy(() => import('./pages/Vendors.tsx'))
const Budget = lazy(() => import('./pages/Budget.tsx'))
const Seating = lazy(() => import('./pages/Seating.tsx'))
const PlannerAccept = lazy(() => import('./pages/PlannerAccept.tsx'))
const VendorLayout = lazy(() => import('./pages/vendor/VendorLayout.tsx'))
const Listing = lazy(() => import('./pages/vendor/Listing.tsx'))
const Enquiries = lazy(() => import('./pages/vendor/Enquiries.tsx'))
const Orders = lazy(() => import('./pages/vendor/Orders.tsx'))
const Weddings = lazy(() => import('./pages/vendor/Weddings.tsx'))
const PlanWedding = lazy(() => import('./pages/vendor/PlanWedding.tsx'))
const Payouts = lazy(() => import('./pages/vendor/Payouts.tsx'))

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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/partner/accept/:token" element={<AcceptInvite />} />
            <Route path="/invite/:slug" element={<Invitation />} />
            <Route path="/invite/:slug/gift" element={<GiftResult />} />
            <Route path="/rsvp/:token" element={<EditRsvp />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/:slug" element={<VendorPage />} />
            <Route path="/planner/accept/:token" element={<PlannerAccept />} />
            <Route element={<RequireAuth />}>
              <Route path="/partner" element={<InvitePartner />} />
              <Route path="/app" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="responses" element={<Responses />} />
                <Route path="share" element={<Share />} />
                <Route path="vendors" element={<Vendors />} />
                <Route path="budget" element={<Budget />} />
                <Route path="seating" element={<Seating />} />
                <Route path="gifts" element={<Gifts />}>
                  <Route index element={<CashGifts />} />
                  <Route path="aso-ebi" element={<AsoEbi />} />
                  <Route path="wishlist" element={<Wishlist />} />
                </Route>
              </Route>
              <Route path="/app/setup/:step?" element={<Setup />} />
              <Route path="/app/design" element={<Design />} />
              <Route path="/app/studio" element={<Studio />} />
            </Route>
            <Route element={<RequireAuth kind="vendor" />}>
              <Route path="/vendor" element={<VendorLayout />}>
                <Route index element={<Listing />} />
                <Route path="enquiries" element={<Enquiries />} />
                <Route path="enquiries/:id" element={<Enquiries />} />
                <Route path="orders" element={<Orders />} />
                <Route path="weddings" element={<Weddings />} />
                <Route path="weddings/:weddingId" element={<PlanWedding />} />
                <Route path="payouts" element={<Payouts />} />
              </Route>
            </Route>
            {StyleGuide && <Route path="/styleguide" element={<StyleGuide />} />}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
