import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Accounts from './pages/Accounts.jsx'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home page - shows Vite logo for now */}
        <Route path="/" element={
          <div className="App">
            <h1>Money Manager</h1>
            <p>Welcome! Go to <a href="/accounts">Accounts</a></p>
          </div>
        } />

        {/* YOUR FEATURE PAGE */}
        <Route path="/accounts" element={<Accounts />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App 