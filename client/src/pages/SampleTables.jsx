import React from 'react';

const Section = ({ title, headers, rows }) => (
  <section className="mb-8">
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <div className="overflow-x-auto border rounded-md">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left px-3 py-2 border-b">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="odd:bg-white even:bg-gray-50">
              {row.map((cell, i) => (
                <td key={i} className="px-3 py-2 border-b whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default function SampleTables() {
  const users = {
    headers: ['Name', 'Email', 'Currency', 'Last Login'],
    rows: [['John Doe', 'john@example.com', 'USD', 'Demo']],
  };

  const accounts = {
    headers: ['Name', 'Type', 'Balance', 'Currency'],
    rows: [
      ['Main Checking', 'checking', '5420.50', 'USD'],
      ['Savings Account', 'savings', '12350.00', 'USD'],
      ['Credit Card', 'credit', '-1285.75', 'USD'],
      ['Cash Wallet', 'cash', '250.00', 'USD'],
    ],
  };

  const expenseCategories = {
    headers: ['Name', 'Color', 'Budget Limit'],
    rows: [
      ['Groceries', '#10B981', '600.00'],
      ['Rent', '#3B82F6', '1500.00'],
      ['Utilities', '#F59E0B', '200.00'],
      ['Transportation', '#6366F1', '300.00'],
      ['Entertainment', '#EC4899', '200.00'],
      ['Dining Out', '#EF4444', '300.00'],
      ['Healthcare', '#14B8A6', '150.00'],
      ['Shopping', '#8B5CF6', '250.00'],
      ['Education', '#F97316', '200.00'],
      ['Insurance', '#06B6D4', '300.00'],
    ],
  };

  const incomeCategories = {
    headers: ['Name', 'Color'],
    rows: [
      ['Salary', '#10B981'],
      ['Freelance', '#3B82F6'],
      ['Investment', '#8B5CF6'],
      ['Bonus', '#F59E0B'],
      ['Other', '#6B7280'],
    ],
  };

  const expenses = {
    headers: ['Amount', 'Date', 'Description', 'Category', 'Account'],
    rows: [
      ['1500.00', '1st of month', 'Monthly rent payment', 'Rent', 'Main Checking'],
      ['180.00', '5th of month', 'Electric and water bill', 'Utilities', 'Main Checking'],
      ['250.00', '1st of month', 'Health insurance premium', 'Insurance', 'Main Checking'],
      ['110.00', 'weekly', 'Weekly grocery shopping', 'Groceries', 'Main Checking/Credit'],
      ['45.00', 'random days', 'Lunch/Dinner/Brunch', 'Dining Out', 'Credit Card'],
      ['55.00', 'random days', 'Gas station fill-up', 'Transportation', 'Main Checking'],
      ['30.00', 'random days', 'Movie/Streaming/Gaming', 'Entertainment', 'Credit Card'],
      ['120.00', 'occasional', 'New clothes/electronics', 'Shopping', 'Credit Card'],
      ['60.00', 'occasional', 'Doctor/Prescription', 'Healthcare', 'Main Checking'],
    ],
  };

  const incomes = {
    headers: ['Amount', 'Date', 'Source', 'Category', 'Account'],
    rows: [
      ['4500.00', '1st monthly', 'Monthly salary', 'Salary', 'Main Checking'],
      ['800-1300', '15th (alt months)', 'Freelance project', 'Freelance', 'Main Checking'],
    ],
  };

  const budgets = {
    headers: ['Amount', 'Period', '% Used', 'Exceeded', 'Category'],
    rows: [
      ['600.00', 'monthly', '58.3', 'false', 'Groceries'],
      ['300.00', 'monthly', '81.7', 'true', 'Dining Out'],
      ['300.00', 'monthly', '81.7', 'true', 'Transportation'],
      ['200.00', 'monthly', '62.5', 'false', 'Entertainment'],
      ['250.00', 'monthly', '72.0', 'false', 'Shopping'],
    ],
  };

  const debts = {
    headers: ['Name', 'Current Balance', 'Interest %', 'Due Day'],
    rows: [
      ['Student Loan - Federal', '28500.00', '4.50', '15'],
      ['Credit Card - Visa', '1285.00', '18.90', '25'],
      ['Auto Loan', '12400.00', '5.20', '5'],
    ],
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Sample Tables (Seed-Aligned)</h1>
      <Section title="Users" {...users} />
      <Section title="Accounts" {...accounts} />
      <Section title="Expense Categories" {...expenseCategories} />
      <Section title="Income Categories" {...incomeCategories} />
      <Section title="Expenses" {...expenses} />
      <Section title="Incomes" {...incomes} />
      <Section title="Budgets" {...budgets} />
      <Section title="Debts" {...debts} />
    </div>
  );
}
