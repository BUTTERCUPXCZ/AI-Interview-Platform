import Login from "./pages/Login"
import Register from "./pages/Register"
import InterviewSession from "./pages/InterviewSession"
import TextInterviewSession from "./pages/TextInterviewSession"
import CodingSandbox from "./pages/CodingSandbox"
import Feedback from "./pages/Feedback"
import EnhancedFeedback from "./pages/EnhancedFeedback"
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import InterviewSetup from "./pages/InterviewSetup";
import Progress from "./pages/Progress";
import ProfilePage from "./pages/ProfilePage";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path='/' element={<Login />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />

        {/* Protected routes */}
        <Route path='/dashboard' element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path='/interview-setup' element={
          <ProtectedRoute>
            <InterviewSetup />
          </ProtectedRoute>
        } />

        <Route path='/interview-session' element={
          <ProtectedRoute>
            <InterviewSession />
          </ProtectedRoute>
        } />

        <Route path='/text-interview-session' element={
          <ProtectedRoute>
            <TextInterviewSession />
          </ProtectedRoute>
        } />

        <Route path='/coding-sandbox' element={
          <ProtectedRoute>
            <CodingSandbox />
          </ProtectedRoute>
        } />

        <Route path='/feedback' element={
          <ProtectedRoute>
            <Feedback />
          </ProtectedRoute>
        } />

        <Route path='/enhanced-feedback' element={
          <ProtectedRoute>
            <EnhancedFeedback />
          </ProtectedRoute>
        } />

        <Route path='/progress' element={
          <ProtectedRoute>
            <Progress />
          </ProtectedRoute>
        } />

        <Route path='/profile' element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />

        {/* Redirect any unknown routes to login */}
        <Route path='*' element={<Navigate to='/login' replace />} />
      </Routes>
    </>
  )
}

export default App
