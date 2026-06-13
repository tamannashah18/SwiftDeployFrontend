// Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
// Bootstrap Bundle JS (includes Popper)
import 'bootstrap/dist/js/bootstrap.bundle.min';
// Custom CSS
import './App.css';
import { Routes, Route } from 'react-router-dom';
import NotFound from './Pages/NotFound';
import  Logs from './Pages/Logs';
import {NavigationBar} from './Components/NavigationBar';
import Header from './Components/Header';
import Landing from './Pages/Landing';
import Profile from './Pages/Profile';
import Projects from './Pages/Projects';
import AuthCallback from './Components/AuthCallback';
import CompleteProfile from './Pages/CompleteProfile';
import Login from './Pages/Login';
import RegisterUser from './Pages/RegisterUser';
import { useNavigate } from 'react-router-dom';
import NetlifyCallback from './Components/NetlifyCallback';
import Dashboard from './Pages/Dashboard';
import NewProject from './Pages/NewProject';
import DeploymentMonitor from './Pages/DeploymentMonitor';
import ProjectDetail from './Pages/ProjectDetail';
import Deployments from './Pages/Deployments';
import DeploymentDetail from './Pages/DeploymentDetail';
import HelpSupport from './Pages/HelpSupport';
import DeploymentToastProvider from './Components/DeploymentToast';
 
function App() {
  const AuthCallbackWrapper = () => {
  const navigate = useNavigate();
  return <AuthCallback navigate={navigate} />;
};
  return (
    <div className="App d-flex flex-column min-vh-100">
      {/* Global real-time notifications for scheduled deployments */}
      <DeploymentToastProvider />
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/*" element={<NotFound />} />
          <Route path="/header" element={<Header />} />
          <Route path="/auth-callback" element={<AuthCallbackWrapper />} />
          <Route path="/netlify-callback" element={<NetlifyCallback />} />
          <Route path="/logs/:deploymentId" element={<Logs />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/new-project" element={<NewProject />} />
          <Route path="/deployments" element={<Deployments />} />
          <Route path="/deployment/:projectId" element={<DeploymentMonitor />} />
          <Route path="/deployment-detail/:id" element={<DeploymentDetail />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/complete-profile/:userId" element={<CompleteProfile />} />
          <Route path="/register" element={<RegisterUser />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/help-support" element={<HelpSupport />} />


        </Routes>
      </main>
    </div>
  );
}

export default App;
