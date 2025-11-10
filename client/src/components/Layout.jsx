import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

// Placeholder components for now (will be built by other team members)
const Dashboard = () => <div className="p-8"><h1 className="text-2xl font-bold">Dashboard</h1><p>Coming soon...</p></div>;
const Accounts = () => <div className="p-8"><h1 className="text-2xl font-bold">Accounts</h1><p>Coming soon...</p></div>;
const Expenses = () => <div className="p-8"><h1 className="text-2xl font-bold">Expenses</h1><p>Coming soon...</p></div>;
const Incomes = () => <div className="p-8"><h1 className="text-2xl font-bold">Incomes</h1><p>Coming soon...</p></div>;
const Categories = () => <div className="p-8"><h1 className="text-2xl font-bold">Categories</h1><p>Coming soon...</p></div>;
const Profile = () => <div className="p-8"><h1 className="text-2xl font-bold">Profile</h1><p>Coming soon...</p></div>;

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/incomes" element={<Incomes />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Layout;