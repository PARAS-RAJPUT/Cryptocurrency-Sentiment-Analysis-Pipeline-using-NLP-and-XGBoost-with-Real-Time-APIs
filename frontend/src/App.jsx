import { Routes, Route, Navigate } from "react-router-dom";
import Navbar     from "./components/Navbar";
import Dashboard  from "./pages/Dashboard";
import Analytics  from "./pages/Analytics";
import Prediction from "./pages/Prediction";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/"          element={<Dashboard />}  />
          <Route path="/analytics" element={<Analytics />}  />
          <Route path="/predict"   element={<Prediction />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
