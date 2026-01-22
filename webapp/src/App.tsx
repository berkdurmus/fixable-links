import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { FixableLinkViewer } from './pages/FixableLinkViewer';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/f/:shortCode" element={<FixableLinkViewer />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
