import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Wallet, 
  TrendingDown, 
  TrendingUp, 
  Tag, 
  User, 
  X,
  BarChart3,
  Target,
  CreditCard,
  MessageCircle
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Budgets', href: '/budgets', icon: Target },
    { name: 'Debts', href: '/debts', icon: CreditCard },
    { name: 'AI Assistant', href: '/chatbot', icon: MessageCircle },
    { name: 'Accounts', href: '/accounts', icon: Wallet },
    { name: 'Expenses', href: '/expenses', icon: TrendingDown },
    { name: 'Incomes', href: '/incomes', icon: TrendingUp },
    { name: 'Categories', href: '/categories', icon: Tag },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden dark:bg-gray-900 dark:bg-opacity-80"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Expense Tracker</h1>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                    ${isActive 
                      ? 'bg-primary-100 text-primary-700 dark:bg-gray-800 dark:text-primary-300' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                    }
                  `}
                >
                  <Icon 
                    className={`
                      mr-3 h-5 w-5 flex-shrink-0
                      ${isActive ? 'text-primary-500 dark:text-primary-300' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-200'}
                    `} 
                  />
                  {item.name}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;