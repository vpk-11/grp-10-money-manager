const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Account = require('./models/Account');
const ExpenseCategory = require('./models/ExpenseCategory');
const IncomeCategory = require('./models/IncomeCategory');
const Expense = require('./models/Expense');
const Income = require('./models/Income');
const Budget = require('./models/Budget');
const Debt = require('./models/Debt');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

const seedData = async () => {
  try {
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Account.deleteMany({});
    await ExpenseCategory.deleteMany({});
    await IncomeCategory.deleteMany({});
    await Expense.deleteMany({});
    await Income.deleteMany({});
    await Budget.deleteMany({});
    await Debt.deleteMany({});

    // Create demo user
    console.log(' Creating demo user...');
    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123', // Will be hashed by the User model's pre-save hook
      currency: 'USD',
      timezone: 'America/New_York',
      isEmailVerified: true,
      lastLogin: new Date()
    });

    console.log('💳 Creating accounts...');
    const accounts = await Account.create([
      {
        userId: user._id,
        name: 'Main Checking',
        type: 'checking',
        balance: 5420.50,
        color: '#3B82F6',
        icon: 'bank',
        description: 'Primary checking account'
      },
      {
        userId: user._id,
        name: 'Savings Account',
        type: 'savings',
        balance: 12350.00,
        color: '#10B981',
        icon: 'piggy-bank',
        description: 'Emergency fund and savings'
      },
      {
        userId: user._id,
        name: 'Credit Card',
        type: 'credit',
        balance: -1285.75,
        color: '#EF4444',
        icon: 'credit-card',
        description: 'Visa ending in 4532'
      },
      {
        userId: user._id,
        name: 'Cash Wallet',
        type: 'cash',
        balance: 250.00,
        color: '#F59E0B',
        icon: 'wallet',
        description: 'Physical cash on hand'
      }
    ]);

    console.log('Creating expense categories...');
    const expenseCategories = await ExpenseCategory.create([
      {
        userId: user._id,
        name: 'Groceries',
        description: 'Food and household items',
        color: '#10B981',
        icon: 'shopping-cart',
        budgetLimit: 600,
        budgetPeriod: 'monthly',
        isDefault: true
      },
      {
        userId: user._id,
        name: 'Rent',
        description: 'Monthly housing rent',
        color: '#3B82F6',
        icon: 'home',
        budgetLimit: 1500,
        budgetPeriod: 'monthly',
        isDefault: true
      },
      {
        userId: user._id,
        name: 'Utilities',
        description: 'Electric, water, gas, internet',
        color: '#F59E0B',
        icon: 'zap',
        budgetLimit: 200,
        budgetPeriod: 'monthly',
        isDefault: true
      },
      {
        userId: user._id,
        name: 'Transportation',
        description: 'Gas, public transit, rideshare',
        color: '#6366F1',
        icon: 'car',
        budgetLimit: 300,
        budgetPeriod: 'monthly',
        isDefault: true
      },
      {
        userId: user._id,
        name: 'Entertainment',
        description: 'Movies, games, hobbies',
        color: '#EC4899',
        icon: 'film',
        budgetLimit: 200,
        budgetPeriod: 'monthly',
        isDefault: true
      },
      {
        userId: user._id,
        name: 'Dining Out',
        description: 'Restaurants and cafes',
        color: '#EF4444',
        icon: 'utensils',
        budgetLimit: 300,
        budgetPeriod: 'monthly',
        isDefault: true
      },
      {
        userId: user._id,
        name: 'Healthcare',
        description: 'Medical, dental, pharmacy',
        color: '#14B8A6',
        icon: 'heart',
        budgetLimit: 150,
        budgetPeriod: 'monthly',
        isDefault: true
      },
      {
        userId: user._id,
        name: 'Shopping',
        description: 'Clothing, electronics, misc',
        color: '#8B5CF6',
        icon: 'shopping-bag',
        budgetLimit: 250,
        budgetPeriod: 'monthly',
        isDefault: true
      },
      {
        userId: user._id,
        name: 'Education',
        description: 'Books, courses, tuition',
        color: '#F97316',
        icon: 'book',
        budgetLimit: 200,
        budgetPeriod: 'monthly',
        isDefault: true
      },
      {
        userId: user._id,
        name: 'Insurance',
        description: 'Health, auto, life insurance',
        color: '#06B6D4',
        icon: 'shield',
        budgetLimit: 300,
        budgetPeriod: 'monthly',
        isDefault: true
      }
    ]);

    console.log('Creating income categories...');
    const incomeCategories = await IncomeCategory.create([
      {
        userId: user._id,
        name: 'Salary',
        description: 'Monthly employment income',
        color: '#10B981',
        icon: 'briefcase',
        isDefault: true
      },
      {
        userId: user._id,
        name: 'Freelance',
        description: 'Freelance project payments',
        color: '#3B82F6',
        icon: 'code',
        isDefault: true
      },
      {
        userId: user._id,
        name: 'Investment',
        description: 'Dividends and capital gains',
        color: '#8B5CF6',
        icon: 'trending-up',
        isDefault: true
      },
      {
        userId: user._id,
        name: 'Bonus',
        description: 'Work bonuses and incentives',
        color: '#F59E0B',
        icon: 'award',
        isDefault: true
      },
      {
        userId: user._id,
        name: 'Other',
        description: 'Miscellaneous income',
        color: '#6B7280',
        icon: 'dollar-sign',
        isDefault: true
      }
    ]);

    console.log('Creating income records...');
    const now = new Date();
    const incomes = [];
    
    // Generate income for the past 6 months
    for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
      const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
      
      // Monthly salary
      incomes.push({
        userId: user._id,
        accountId: accounts[0]._id,
        categoryId: incomeCategories[0]._id,
        amount: 4500,
        description: 'Monthly salary',
        date: new Date(date.getFullYear(), date.getMonth(), 1),
        paymentMethod: 'bank_transfer',
        source: 'ABC Tech Company'
      });
      
      // Occasional freelance income
      if (monthsAgo % 2 === 0) {
        incomes.push({
          userId: user._id,
          accountId: accounts[0]._id,
          categoryId: incomeCategories[1]._id,
          amount: 800 + Math.random() * 500,
          description: 'Freelance web development project',
          date: new Date(date.getFullYear(), date.getMonth(), 15),
          paymentMethod: 'bank_transfer',
          source: 'Various clients'
        });
      }
    }
    
    await Income.create(incomes);

    console.log('Creating expense records...');
    const expenses = [];
    const today = new Date();
    
    // Generate expenses for the past 6 months
    for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1);
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
      
      // Rent (monthly)
      expenses.push({
        userId: user._id,
        accountId: accounts[0]._id,
        categoryId: expenseCategories[1]._id,
        amount: 1500,
        description: 'Monthly rent payment',
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        paymentMethod: 'bank_transfer',
        location: 'Apartment Complex',
        tags: ['housing', 'fixed']
      });
      
      // Utilities (monthly)
      expenses.push({
        userId: user._id,
        accountId: accounts[0]._id,
        categoryId: expenseCategories[2]._id,
        amount: 120 + Math.random() * 80,
        description: 'Electric and water bill',
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5),
        paymentMethod: 'bank_transfer',
        tags: ['utilities', 'recurring']
      });
      
      // Insurance (monthly)
      expenses.push({
        userId: user._id,
        accountId: accounts[0]._id,
        categoryId: expenseCategories[9]._id,
        amount: 250,
        description: 'Health insurance premium',
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        paymentMethod: 'bank_transfer',
        tags: ['insurance', 'health']
      });
      
      // Groceries (weekly)
      for (let week = 0; week < 4; week++) {
        const dayOfWeek = 7 + (week * 7);
        if (dayOfWeek <= daysInMonth) {
          expenses.push({
            userId: user._id,
            accountId: monthsAgo === 0 && week >= 2 ? accounts[2]._id : accounts[0]._id,
            categoryId: expenseCategories[0]._id,
            amount: 80 + Math.random() * 70,
            description: 'Weekly grocery shopping',
            date: new Date(monthDate.getFullYear(), monthDate.getMonth(), dayOfWeek),
            paymentMethod: 'card',
            location: 'Local Supermarket',
            tags: ['food', 'groceries']
          });
        }
      }
      
      // Dining out (2-4 times per month)
      const diningCount = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < diningCount; i++) {
        const randomDay = 5 + Math.floor(Math.random() * (daysInMonth - 5));
        expenses.push({
          userId: user._id,
          accountId: accounts[2]._id,
          categoryId: expenseCategories[5]._id,
          amount: 25 + Math.random() * 50,
          description: ['Lunch at cafe', 'Dinner with friends', 'Coffee and pastry', 'Weekend brunch'][Math.floor(Math.random() * 4)],
          date: new Date(monthDate.getFullYear(), monthDate.getMonth(), randomDay),
          paymentMethod: 'card',
          tags: ['food', 'dining']
        });
      }
      
      // Transportation
      for (let i = 0; i < 3; i++) {
        const randomDay = 3 + Math.floor(Math.random() * (daysInMonth - 3));
        expenses.push({
          userId: user._id,
          accountId: accounts[0]._id,
          categoryId: expenseCategories[3]._id,
          amount: 40 + Math.random() * 30,
          description: 'Gas station fill-up',
          date: new Date(monthDate.getFullYear(), monthDate.getMonth(), randomDay),
          paymentMethod: 'card',
          location: 'Gas Station',
          tags: ['transport', 'gas']
        });
      }
      
      // Entertainment (1-3 times per month)
      const entertainmentCount = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < entertainmentCount; i++) {
        const randomDay = 10 + Math.floor(Math.random() * (daysInMonth - 10));
        expenses.push({
          userId: user._id,
          accountId: accounts[2]._id,
          categoryId: expenseCategories[4]._id,
          amount: 15 + Math.random() * 45,
          description: ['Movie tickets', 'Streaming subscription', 'Concert tickets', 'Gaming'][Math.floor(Math.random() * 4)],
          date: new Date(monthDate.getFullYear(), monthDate.getMonth(), randomDay),
          paymentMethod: 'card',
          tags: ['entertainment', 'leisure']
        });
      }
      
      // Shopping (occasional)
      if (Math.random() > 0.5) {
        const randomDay = 5 + Math.floor(Math.random() * (daysInMonth - 5));
        expenses.push({
          userId: user._id,
          accountId: accounts[2]._id,
          categoryId: expenseCategories[7]._id,
          amount: 50 + Math.random() * 150,
          description: ['New clothes', 'Electronics accessory', 'Home decor', 'Personal items'][Math.floor(Math.random() * 4)],
          date: new Date(monthDate.getFullYear(), monthDate.getMonth(), randomDay),
          paymentMethod: 'card',
          tags: ['shopping', 'personal']
        });
      }
      
      // Healthcare (occasional)
      if (monthsAgo % 2 === 0) {
        expenses.push({
          userId: user._id,
          accountId: accounts[0]._id,
          categoryId: expenseCategories[6]._id,
          amount: 30 + Math.random() * 70,
          description: ['Doctor copay', 'Prescription medication', 'Dental checkup'][Math.floor(Math.random() * 3)],
          date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 15),
          paymentMethod: 'card',
          tags: ['health', 'medical']
        });
      }
    }
    
    await Expense.create(expenses);

    console.log('📊 Creating budgets...');
    const currentMonth = new Date();
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    
    const budgets = await Budget.create([
      {
        userId: user._id,
        categoryId: expenseCategories[0]._id, // Groceries
        amount: 600,
        period: 'monthly',
        startDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        endDate: nextMonth,
        alertThreshold: 80,
        spent: 350,
        notes: 'Try to buy more bulk items to save money'
      },
      {
        userId: user._id,
        categoryId: expenseCategories[3]._id, // Transportation
        amount: 300,
        period: 'monthly',
        startDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        endDate: nextMonth,
        alertThreshold: 75,
        spent: 245,
        alertSent: true
      },
      {
        userId: user._id,
        categoryId: expenseCategories[5]._id, // Dining Out
        amount: 300,
        period: 'monthly',
        startDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        endDate: nextMonth,
        alertThreshold: 80,
        spent: 275,
        alertSent: true,
        notes: 'Budget is almost exceeded!'
      },
      {
        userId: user._id,
        categoryId: expenseCategories[4]._id, // Entertainment
        amount: 200,
        period: 'monthly',
        startDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        endDate: nextMonth,
        alertThreshold: 85,
        spent: 125
      },
      {
        userId: user._id,
        categoryId: expenseCategories[7]._id, // Shopping
        amount: 250,
        period: 'monthly',
        startDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        endDate: nextMonth,
        alertThreshold: 80,
        spent: 180
      }
    ]);

    console.log('💳 Creating debts...');
    const debts = await Debt.create([
      {
        userId: user._id,
        name: 'Student Loan - Federal',
        type: 'student_loan',
        principal: 35000,
        currentBalance: 28500,
        interestRate: 4.5,
        minimumPayment: 350,
        dueDate: 15,
        startDate: new Date('2020-09-01'),
        lender: 'Federal Student Aid',
        accountNumber: '****5678',
        status: 'active',
        reminderEnabled: true,
        reminderDaysBefore: 5,
        totalPaid: 6500,
        lastPaymentDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 15),
        lastPaymentAmount: 350,
        notes: 'Standard repayment plan, 10 years',
        color: '#3B82F6'
      },
      {
        userId: user._id,
        name: 'Credit Card - Visa',
        type: 'credit_card',
        principal: 2500,
        currentBalance: 1285,
        interestRate: 18.9,
        minimumPayment: 50,
        dueDate: 25,
        startDate: new Date('2022-03-15'),
        lender: 'Chase Bank',
        accountNumber: '****4532',
        status: 'active',
        reminderEnabled: true,
        reminderDaysBefore: 3,
        totalPaid: 1215,
        lastPaymentDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 25),
        lastPaymentAmount: 100,
        notes: 'Try to pay more than minimum to reduce interest',
        color: '#EF4444'
      },
      {
        userId: user._id,
        name: 'Auto Loan',
        type: 'auto_loan',
        principal: 18000,
        currentBalance: 12400,
        interestRate: 5.2,
        minimumPayment: 325,
        dueDate: 5,
        startDate: new Date('2021-06-01'),
        lender: 'Auto Finance Corp',
        accountNumber: '****8901',
        status: 'active',
        reminderEnabled: true,
        reminderDaysBefore: 3,
        totalPaid: 5600,
        lastPaymentDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 5),
        lastPaymentAmount: 325,
        notes: '2019 Honda Accord - 5 year loan',
        color: '#8B5CF6'
      }
    ]);

    // Calculate estimated payoff dates
    for (const debt of debts) {
      debt.estimatedPayoffDate = debt.calculateEstimatedPayoff();
      await debt.save();
    }

    console.log('\nSeed data created successfully!');
    console.log('\nSummary:');
    console.log(`   Users: 1`);
    console.log(`   Accounts: ${accounts.length}`);
    console.log(`   Expense Categories: ${expenseCategories.length}`);
    console.log(`   Income Categories: ${incomeCategories.length}`);
    console.log(`   Incomes: ${incomes.length}`);
    console.log(`   Expenses: ${expenses.length}`);
    console.log(`   Budgets: ${budgets.length}`);
    console.log(`   Debts: ${debts.length}`);
    console.log('\n🔐 Demo Login Credentials:');
    console.log(`   Email: john@example.com`);
    console.log(`   Password: password123`);
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
