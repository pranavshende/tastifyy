import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/restaurant" replace />} />
          <Route path="/restaurant/*" element={<div className="p-4 text-2xl font-bold text-orange-600">Restaurant Panel Placeholder</div>} />
          <Route path="/admin/*" element={<div className="p-4 text-2xl font-bold text-blue-600">Admin Panel Placeholder</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
