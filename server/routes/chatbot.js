const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Budget = require('../models/Budget');
const Debt = require('../models/Debt');
const Account = require('../models/Account');
const { queryLLM, checkOllamaStatus } = require('../utils/llm');

// Check Ollama status endpoint
router.get('/status', async (req, res) => {
  try {
    const isOnline = await checkOllamaStatus();
    res.json({ ollamaOnline: isOnline });
  } catch (error) {
    res.json({ ollamaOnline: false });
  }
});

// Check if a model is available locally
router.post('/check-model', async (req, res) => {
  try {
    const { model } = req.body;
    const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    
    const response = await require('axios').get(`${ollamaUrl}/api/tags`);
    const installedModels = response.data.models || [];
    const isAvailable = installedModels.some(m => m.name === model || m.model === model);
    
    res.json({ available: isAvailable, model });
  } catch (error) {
    res.status(500).json({ available: false, error: error.message });
  }
});

// Install a model
router.post('/install-model', async (req, res) => {
  try {
    const { model } = req.body;
    
    if (!model) {
      return res.status(400).json({ success: false, message: 'Model is required' });
    }

    console.log(`[Model Install] Installing ${model}...`);
    
    // Execute ollama pull command
    try {
      const { stdout, stderr } = await execPromise(`ollama pull ${model}`, {
        timeout: 600000 // 10 minutes timeout
      });
      
      console.log(`[Model Install] ${model} installed successfully`);
      console.log('Output:', stdout);
      
      if (stderr && !stderr.includes('pulling')) {
        console.warn('Warnings:', stderr);
      }
      
      return res.json({ 
        success: true, 
        message: `${model} installed successfully`,
        output: stdout
      });
    } catch (error) {
      console.error(`[Model Install] Error installing ${model}:`, error.message);
      return res.status(500).json({ 
        success: false, 
        message: `Failed to install ${model}: ${error.message}` 
      });
    }
  } catch (error) {
    console.error('[Model Install] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to install model' });
  }
});

// Toggle Ollama on/off
router.post('/toggle-ollama', async (req, res) => {
  try {
    const { action } = req.body;

    if (action === 'start') {
      // Start Ollama service
      try {
        console.log('[Ollama] Starting Ollama service...');
        await execPromise('brew services start ollama');
        
        // Wait and retry checking status (up to 10 seconds)
        let attempts = 0;
        let isOnline = false;
        while (attempts < 10 && !isOnline) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          isOnline = await checkOllamaStatus();
          attempts++;
          console.log(`[Ollama] Check attempt ${attempts}: ${isOnline ? 'Online' : 'Offline'}`);
        }
        
        if (isOnline) {
          console.log('[Ollama] Successfully started');
          return res.json({ success: true, message: 'Ollama started successfully' });
        } else {
          console.error('[Ollama] Failed to start after 10 seconds');
          return res.status(500).json({ success: false, message: 'Ollama failed to start. Please check if Ollama is installed.' });
        }
      } catch (error) {
        console.error('[Ollama] Error starting:', error.message);
        return res.status(500).json({ success: false, message: `Failed to start Ollama: ${error.message}` });
      }
    } else if (action === 'stop') {
      // Stop Ollama service
      try {
        console.log('[Ollama] Stopping Ollama service...');
        await execPromise('brew services stop ollama');
        console.log('[Ollama] Successfully stopped');
        return res.json({ success: true, message: 'Ollama stopped successfully' });
      } catch (error) {
        console.error('[Ollama] Error stopping:', error.message);
        return res.status(500).json({ success: false, message: `Failed to stop Ollama: ${error.message}` });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('[Ollama] Toggle error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle Ollama' });
  }
});

// Chatbot endpoint - provides financial insights and answers
// This route performs its own auth so it accepts either an Authorization header
// or a `token` in the request body. It verifies real JWTs using `JWT_SECRET`.
router.post('/message', async (req, res) => {
  try {
    const { message, model } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Authentication: allow token in header or in body (for easy testing)
    const headerToken = req.header('Authorization')?.replace('Bearer ', '') || null;
    const bodyToken = req.body.token || null;
    const token = headerToken || bodyToken;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    let user;
    // Verify real JWT
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await require('../models/User').findById(decoded.userId).select('-password');
      if (!user) return res.status(401).json({ message: 'Token is not valid (user not found)' });
    } catch (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).json({ message: 'Token is not valid' });
    }

    const normalizedMessage = message.toLowerCase().trim();

    // Generate response based on message content
    let response = await generateResponse(normalizedMessage, user._id, model);

    res.json({
      message: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    if (error.message === 'OLLAMA_OFFLINE') {
      return res.status(503).json({ 
        message: 'Advanced chatbot is currently offline. Basic financial queries are still available.',
        ollamaOffline: true
      });
    }
    res.status(500).json({ message: 'Failed to process message' });
  }
});

// Generate intelligent response based on user query
async function generateResponse(message, userId, model = null) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Specific data queries use rule-based responses. Everything else (advice, questions, etc.) uses AI.
  const isSpecificDataQuery = [
    'how much did i spend',
    'how much have i spent',
    'what did i spend',
    'show my spending',
    'show my expenses',
    'how much did i earn',
    'how much income',
    'show my income',
    'what is my balance',
    'account balance',
    'show my budget',
    'budget status'
  ].some(phrase => message.includes(phrase));
  
  // For everything else (advice, should I buy, can I afford, etc.), use AI with financial context
  const isFinancialQuery = isSpecificDataQuery;

  // Always fetch user's financial data for context
  const [expenses, incomes, budgets, debts, accounts] = await Promise.all([
    Expense.find({ userId, date: { $gte: startOfMonth, $lte: endOfMonth } }).populate('categoryId').limit(50),
    Income.find({ userId, date: { $gte: startOfMonth, $lte: endOfMonth } }).populate('categoryId').limit(50),
    Budget.find({ userId }).populate('categoryId'),
    Debt.find({ userId }),
    Account.find({ userId })
  ]);

  // Calculate summary stats
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const totalDebt = debts.reduce((sum, debt) => sum + (debt.currentBalance || 0), 0);
  const totalSavings = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  
  // Build detailed financial context
  const accountDetails = accounts.length > 0 
    ? accounts.map(acc => `  • ${acc.name || 'Unnamed'}: $${(acc.balance || 0).toFixed(2)}`).join('\n')
    : '  • No accounts added yet';
    
  const totalAvailableFunds = totalSavings; // Total in all accounts
  const monthlyExpenseAvg = totalExpenses;
  const monthlyIncomeAvg = totalIncome;
  
  const debtDetails = debts.length > 0
    ? debts.map(debt => `  • ${debt.name || 'Unnamed'}: $${(debt.currentBalance || 0).toFixed(2)} remaining`).join('\n')
    : '  • No debts tracked';
    
  const recentExpenses = expenses.slice(0, 5).map(e => 
    `  • ${e.categoryId?.name || 'Other'}: $${e.amount.toFixed(2)} (${e.description || 'no description'})`
  ).join('\n');

  const financialContext = `
IMPORTANT: Use these EXACT numbers for calculations. This is the user's real financial data.

Current Financial Position:
- TOTAL AVAILABLE FUNDS (all accounts): $${totalAvailableFunds.toFixed(2)}
- Monthly Expenses: $${monthlyExpenseAvg.toFixed(2)}
- Monthly Income: $${monthlyIncomeAvg.toFixed(2)}
- Outstanding Debts: $${totalDebt.toFixed(2)}

Account Breakdown:
${accountDetails}

Outstanding Debts:
${debtDetails}

Recent Expenses This Month:
${recentExpenses || '  • No expenses recorded yet'}

When answering purchase questions (e.g., "can I buy a $5000 car?"):
1. Calculate: Total Available Funds ($${totalAvailableFunds.toFixed(2)}) - Purchase Amount = Remaining
2. Consider if remaining amount covers monthly expenses ($${monthlyExpenseAvg.toFixed(2)})
3. Factor in existing debts ($${totalDebt.toFixed(2)})
4. Give specific dollar amounts in your response
`.trim();

  console.log('Financial Context for user:', userId);
  console.log(financialContext);

  if (!isFinancialQuery) {
    // Use Ollama for general chat or advice WITH financial context
    try {
      const llmPrompt = `You are a personal finance assistant analyzing a user's actual financial data from their money management app. You have access to their REAL account balances, expenses, income, and debts shown below.

${financialContext}

CRITICAL INSTRUCTIONS:
1. You MUST use the exact dollar amounts provided above in your responses
2. When asked about money/balance, state: "You have $${totalAvailableFunds.toFixed(2)} total across your accounts"
3. When asked about affordability, perform this calculation:
   - Available: $${totalAvailableFunds.toFixed(2)}
   - After purchase: $${totalAvailableFunds.toFixed(2)} - [purchase amount] = [result]
   - Can cover monthly expenses ($${monthlyExpenseAvg.toFixed(2)}): [yes/no]
4. Always reference their specific numbers - do NOT give generic advice
5. Be concise but specific

REQUIRED RESPONSE FORMAT for purchase questions:

**Calculation:**
Total Available: $${totalAvailableFunds.toFixed(2)}
Purchase Cost: $[amount from question]
Remaining: $${totalAvailableFunds.toFixed(2)} - $[amount] = $[result]

**Analysis:**
- Monthly Expenses: $${monthlyExpenseAvg.toFixed(2)}
- Outstanding Debts: $${totalDebt.toFixed(2)}
- Months of expenses covered: [remaining / monthly expenses]

**Recommendation:**
[Based on the numbers, state if this purchase is advisable or not, with specific reasons]

You MUST provide this analysis. Do not refuse or say you cannot help.

User Question: ${message}`;
      
      const llmResponse = await queryLLM(llmPrompt, { max_tokens: 250, model });
      return llmResponse;
    } catch (error) {
      console.error('LLM Error:', error);
      // Fall back to rule-based responses if LLM fails
    }
  }

  // Spending patterns
  if (message.includes('spending') || message.includes('spent') || message.includes('expense')) {
    const expenses = await Expense.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    }).populate('categoryId');

    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    if (expenses.length === 0) {
      return "You haven't recorded any expenses this month yet. Start tracking your spending to get personalized insights!";
    }

    // Group by category
    const byCategory = {};
    expenses.forEach(exp => {
      const catName = exp.categoryId?.name || 'Uncategorized';
      byCategory[catName] = (byCategory[catName] || 0) + exp.amount;
    });

    const topCategory = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])[0];

    return `This month, you've spent $${total.toFixed(2)} across ${expenses.length} transactions. Your highest spending category is ${topCategory[0]} at $${topCategory[1].toFixed(2)} (${((topCategory[1]/total)*100).toFixed(1)}% of total). ${
      topCategory[1] > total * 0.4 ? "💡 Tip: Consider reviewing this category for potential savings!" : "Keep up the balanced spending!"
    }`;
  }

  // Income queries
  if (message.includes('income') || message.includes('earn') || message.includes('salary')) {
    const incomes = await Income.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    }).populate('categoryId');

    const total = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    
    if (incomes.length === 0) {
      return "No income recorded this month. Add your income sources to track your cash flow better!";
    }

    return `Your total income this month is $${total.toFixed(2)} from ${incomes.length} source(s). ${
      total > 0 ? "Great job earning! Make sure to allocate some towards savings and investments." : ""
    }`;
  }

  // Budget queries
  if (message.includes('budget') || message.includes('limit')) {
    const budgets = await Budget.find({ userId }).populate('categoryId');
    
    if (budgets.length === 0) {
      return "You don't have any budgets set up yet. Creating budgets helps you control spending and reach your financial goals! Go to the Budgets page to get started.";
    }

    const activeMonth = budgets.filter(b => 
      b.period === 'monthly' && 
      new Date(b.startDate) <= now && 
      new Date(b.endDate) >= now
    );

    if (activeMonth.length === 0) {
      return `You have ${budgets.length} budget(s) defined, but none are active for the current month. Consider creating monthly budgets to track your spending better!`;
    }

    const overBudget = activeMonth.filter(b => b.isExceeded);
    const nearLimit = activeMonth.filter(b => b.percentageUsed >= 80 && !b.isExceeded);

    if (overBudget.length > 0) {
      return `⚠️ Alert! You've exceeded ${overBudget.length} budget(s) this month: ${overBudget.map(b => b.categoryId?.name).join(', ')}. Review your spending in these categories to get back on track!`;
    }

    if (nearLimit.length > 0) {
      return `⚠️ Warning! You're approaching the limit on ${nearLimit.length} budget(s): ${nearLimit.map(b => `${b.categoryId?.name} (${b.percentageUsed.toFixed(1)}%)`).join(', ')}. Watch your spending carefully!`;
    }

    return `Looking good! All ${activeMonth.length} active budgets are under control. Keep up the disciplined spending! 🎉`;
  }

  // Debt queries
  if (message.includes('debt') || message.includes('owe') || message.includes('loan')) {
    console.log('[Chatbot] Debt query - userId:', userId, 'type:', typeof userId);
    const debts = await Debt.find({ userId });
    console.log('[Chatbot] Found debts:', debts.length);
    if (debts.length > 0) {
      console.log('[Chatbot] First debt:', debts[0].name, 'balance:', debts[0].currentBalance);
    }
    
    if (debts.length === 0) {
      return "Great news! You have no debts recorded. Stay debt-free by living within your means! 🎉";
    }

    const totalDebt = debts.reduce((sum, d) => sum + d.currentBalance, 0);
    const totalOriginal = debts.reduce((sum, d) => sum + d.principal, 0);
    const totalPaid = debts.reduce((sum, d) => sum + (d.totalPaid || 0), 0);
    const progress = totalOriginal > 0 ? ((totalPaid / totalOriginal) * 100).toFixed(1) : 0;

    const highestInterest = debts.sort((a, b) => b.interestRate - a.interestRate)[0];

    return `You have ${debts.length} debt(s) totaling $${totalDebt.toFixed(2)}. You've paid off $${totalPaid.toFixed(2)} (${progress}% progress). 💡 Focus on paying off "${highestInterest.name}" first (${highestInterest.interestRate}% interest) to save on interest charges!`;
  }

  // Savings advice
  if (message.includes('save') || message.includes('saving')) {
    const expenses = await Expense.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const incomes = await Income.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome * 100).toFixed(1) : 0;

    if (netSavings > 0) {
      return `This month, you're saving $${netSavings.toFixed(2)} (${savingsRate}% savings rate). ${
        savingsRate >= 20 ? "Excellent! You're on track for strong financial health! 🌟" :
        savingsRate >= 10 ? "Good job! Try to increase this to 20% for optimal financial security." :
        "Consider increasing your savings rate to at least 20% of your income."
      }`;
    } else {
      return `You're currently spending more than you earn this month (deficit: $${Math.abs(netSavings).toFixed(2)}). Review your expenses and look for areas to cut back. Start with discretionary spending!`;
    }
  }

  // Account balance and money queries
  if (message.includes('balance') || message.includes('account') || message.includes('money') || message.includes('funds') || message.includes('total available')) {
    const accounts = await Account.find({ userId });
    
    if (accounts.length === 0) {
      return "You don't have any accounts set up. Add your bank accounts, credit cards, and wallets to track your total balance!";
    }

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const byType = {};
    accounts.forEach(acc => {
      byType[acc.type] = (byType[acc.type] || 0) + acc.balance;
    });

    const accountList = accounts.map(acc => `  • ${acc.name}: $${acc.balance.toFixed(2)}`).join('\n');

    return `💰 **Your Total Balance: $${totalBalance.toFixed(2)}**

Accounts breakdown:
${accountList}

${totalBalance > 0 ? "Keep building your wealth! 💪" : "Consider ways to increase your income or reduce expenses."}`;
  }

  // Tips and advice
  if (message.includes('tip') || message.includes('advice') || message.includes('help') || message.includes('suggest')) {
    const tips = [
      "💡 Follow the 50/30/20 rule: 50% for needs, 30% for wants, 20% for savings and debt repayment.",
      "💡 Build an emergency fund covering 3-6 months of expenses before investing aggressively.",
      "💡 Pay off high-interest debts first to save money on interest charges.",
      "💡 Track every expense, no matter how small - awareness is the first step to better financial habits.",
      "💡 Automate your savings by setting up automatic transfers on payday.",
      "💡 Review subscriptions monthly and cancel ones you don't use regularly.",
      "💡 Use the 24-hour rule for non-essential purchases over $50 to avoid impulse buying.",
      "💡 Increase your income through side hustles or skill development for faster financial growth.",
      "💡 Set specific financial goals (SMART: Specific, Measurable, Achievable, Relevant, Time-bound).",
      "💡 Review your spending weekly to catch issues early before they become habits."
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  }

  // Summary/overview
  if (message.includes('summary') || message.includes('overview') || message.includes('report')) {
    const [expenses, incomes, budgets, debts, accounts] = await Promise.all([
      Expense.find({ userId, date: { $gte: startOfMonth, $lte: endOfMonth } }),
      Income.find({ userId, date: { $gte: startOfMonth, $lte: endOfMonth } }),
      Budget.find({ userId }),
      Debt.find({ userId }),
      Account.find({ userId })
    ]);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    const totalDebt = debts.reduce((sum, d) => sum + d.currentBalance, 0);
    const netWorth = totalBalance - totalDebt;

    return `📊 Financial Summary for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}:

💰 Total Balance: $${totalBalance.toFixed(2)}
📈 Income: $${totalIncome.toFixed(2)}
📉 Expenses: $${totalExpenses.toFixed(2)}
💵 Net Savings: $${(totalIncome - totalExpenses).toFixed(2)}
💳 Total Debt: $${totalDebt.toFixed(2)}
🏆 Net Worth: $${netWorth.toFixed(2)}

${budgets.length} active budget(s), ${accounts.length} account(s). Keep tracking your progress! 🚀`;
  }

  // Default response with suggestions
  return `I'm your financial assistant! I can help you with:

• "Show my spending" - Analyze your expenses
• "How's my budget?" - Check budget status
• "What's my income?" - View income summary
• "Check my debts" - Debt overview and advice
• "Savings advice" - Get savings tips
• "Account balance" - See all account balances
• "Financial summary" - Complete overview
• "Give me a tip" - Random financial advice

What would you like to know? 💬`;
}


module.exports = router;
