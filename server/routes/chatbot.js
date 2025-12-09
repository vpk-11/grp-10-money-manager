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
  const affordabilityKeywords = ['afford', 'buy', 'purchase', '$', 'cost'];
  const mentionsAffordability = affordabilityKeywords.some(k => message.includes(k)) || /\$\s*\d+/i.test(message);
  const isFinancialQuery = isSpecificDataQuery || message.includes('money') || message.includes('balance') || message.includes('summary') || mentionsAffordability;

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

  const baseContext = `
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
`.trim();

  const affordabilityGuide = `
When answering affordability questions (e.g., "can I buy X?" or questions that include a dollar amount):
1. Calculate: Total Available Funds ($${totalAvailableFunds.toFixed(2)}) - Purchase Amount = Remaining
2. Consider if remaining amount covers monthly expenses ($${monthlyExpenseAvg.toFixed(2)})
3. Factor in existing debts ($${totalDebt.toFixed(2)})
4. Give specific dollar amounts in your response
`.trim();

  console.log('Financial Context for user:', userId);
  console.log(baseContext);

  // Prepare common LLM instructions early so all routes can use them
  const instructions = `
CRITICAL INSTRUCTIONS:
1. Use the exact dollar amounts provided in the context.
2. If asked about balance/money, include: "You have $${totalAvailableFunds.toFixed(2)} total across your accounts."
3. Do NOT introduce topics (like cars) unless the user mentions them.
4. Be concise and specific.
5. Do NOT subtract outstanding debts from available funds when calculating remaining balance after a purchase. Only subtract the purchase amount from total available funds. Consider debts separately in the analysis.
6. Do NOT refuse. Provide neutral, general information based on the user's actual numbers. If the question is casual (e.g., greetings), respond briefly and suggest helpful finance prompts.
7. For affordability questions, include a short recommendation based on remaining funds and months of expenses covered (e.g., not advisable if negative, caution if <1 month, consider waiting if <3 months, reasonable otherwise).
`.trim();

  // Direct summary path for generic money questions (no LLM needed)
  if (message.includes('tell me about my money') || (message.includes('how much money') && !mentionsAffordability)) {
    return `You have $${totalAvailableFunds.toFixed(2)} total across your accounts. This month: income $${monthlyIncomeAvg.toFixed(2)}, expenses $${monthlyExpenseAvg.toFixed(2)}. Debts outstanding: $${totalDebt.toFixed(2)}.`;
  }

  // Early advanced-mode handler: route open-ended finance questions to LLM before small-talk
  try {
    const ollamaOnlineEarly = await checkOllamaStatus();
    const openEndedFinance = (
      message.includes('plan') ||
      message.includes('outline') ||
      message.includes('steps') ||
      message.includes('action plan') ||
      message.includes('recommend') ||
      message.includes('prioritize') ||
      message.includes('improve cash flow') ||
      message.includes('strategy')
    );
    if (model && ollamaOnlineEarly && !isSpecificDataQuery && !mentionsAffordability && (isFinancialQuery || openEndedFinance)) {
      const llmPromptEarly = `You are a personal finance assistant analyzing a user's actual financial data from their money management app.

${baseContext}

${instructions}

User Question: ${message}`;
      const llmResponseEarly = await queryLLM(llmPromptEarly, { max_tokens: 300, model });
      return llmResponseEarly;
    }
  } catch (e) {
    // If LLM fails early, continue to rule-based and later advanced block as fallback
    console.warn('Early LLM route failed, falling back:', e.message);
  }

  // Friendly small-talk handler for casual messages (avoid intercepting finance prompts)
  const greetings = ['hi', 'hello', 'hey', 'whatsup', "what's up", 'how are you'];
  const isGreeting = greetings.some(g => message === g || (message.startsWith(g) && message.length <= g.length + 3));
  // Recompute openEndedFinance here to avoid scope issues
  const openEndedFinanceCheck = (
    message.includes('plan') ||
    message.includes('outline') ||
    message.includes('steps') ||
    message.includes('action plan') ||
    message.includes('recommend') ||
    message.includes('prioritize') ||
    message.includes('improve cash flow') ||
    message.includes('strategy')
  );
  if (isGreeting && !isSpecificDataQuery && !mentionsAffordability && !openEndedFinanceCheck) {
    return "Hey there! I'm your finance assistant. I can chat, but I'm best at money stuff. Want a quick summary, your total balance, or this month’s spending?";
  }

  // Short prompt when user says "tell me"
  if (message === 'tell me' || message.startsWith('tell me')) {
    const summary = `You have $${totalAvailableFunds.toFixed(2)} across accounts. This month: income $${monthlyIncomeAvg.toFixed(2)}, expenses $${monthlyExpenseAvg.toFixed(2)}. Debts outstanding: $${totalDebt.toFixed(2)}.`;
    const next = 'Ask: "Show my spending", "Income vs expense trend", or "Emergency fund guidance".';
    return `${summary}\n${next}`;
  }

  // Rule-based affordability fallback: extract a purchase amount and compute remaining funds neutrally
  if (mentionsAffordability) {
    // Parse amounts like "$1,000,000", "1 million", "1m", "250k", "2.5 thousand"
    const parseScaledAmount = (text) => {
      const scaledRegex = /\$?\s*([\d,.]+)\s*(million|billion|thousand|m|b|k)?/i;
      const match = text.match(scaledRegex);
      if (!match) return null;
      const num = parseFloat(match[1].replace(/,/g, ''));
      if (!Number.isFinite(num)) return null;
      const unit = (match[2] || '').toLowerCase();
      const scale = unit === 'million' || unit === 'm' ? 1_000_000
                  : unit === 'billion' || unit === 'b' ? 1_000_000_000
                  : unit === 'thousand' || unit === 'k' ? 1_000
                  : 1;
      return num * scale;
    };

    // Prefer the largest sensible number in the message to avoid picking a small unrelated figure
    const numberTokens = Array.from(message.matchAll(/\$?\s*([\d,.]+)\s*(million|billion|thousand|m|b|k)?/gi));
    let purchaseAmount = null;
    if (numberTokens.length > 0) {
      const candidates = numberTokens
        .map(m => parseScaledAmount(m[0]))
        .filter(v => Number.isFinite(v) && v >= 0);
      if (candidates.length > 0) {
        // Choose the max candidate assuming the purchase amount is the largest value mentioned
        purchaseAmount = Math.max(...candidates);
      }
    }

    if (Number.isFinite(purchaseAmount) && purchaseAmount >= 0) {
        const remaining = totalAvailableFunds - purchaseAmount;
        const monthsCovered = monthlyExpenseAvg > 0 ? (remaining / monthlyExpenseAvg) : null;
        const recommendation = (() => {
          if (!Number.isFinite(remaining)) return null;
          if (remaining < 0) return 'Recommendation: Not advisable — the purchase exceeds your available funds.';
          if (monthsCovered !== null && monthsCovered < 1) return 'Recommendation: Caution — remaining funds cover less than one month of expenses.';
          if (monthsCovered !== null && monthsCovered < 3) return 'Recommendation: Consider waiting — aim to keep at least 3 months of expenses as buffer.';
          return 'Recommendation: Reasonable — purchase keeps a comfortable buffer based on current expenses.';
        })();
        return [
          'Neutral Calculation:',
          `Calculation: $${totalAvailableFunds.toFixed(2)} - $${purchaseAmount.toFixed(2)} = $${remaining.toFixed(2)}`,
          `Monthly Expenses: $${monthlyExpenseAvg.toFixed(2)}`,
          `Outstanding Debts: $${totalDebt.toFixed(2)}`,
          monthsCovered !== null ? `Months of expenses covered (remaining): ${monthsCovered.toFixed(1)}` : null,
          recommendation
        ].filter(Boolean).join('\n');
    }
  }

    // Prepare optional affordability block (instructions already defined above)

      const purchaseBlock = mentionsAffordability ? `

${affordabilityGuide}

REQUIRED RESPONSE FORMAT for affordability questions:

**Calculation:**
Total Available: $${totalAvailableFunds.toFixed(2)}
Purchase Cost: $[amount from question]
Remaining: $${totalAvailableFunds.toFixed(2)} - $[amount] = $[result]

**Analysis:**
- Monthly Expenses: $${monthlyExpenseAvg.toFixed(2)}
- Outstanding Debts: $${totalDebt.toFixed(2)}
- Months of expenses covered: [remaining / monthly expenses]

**Recommendation:**
[Based on the numbers, state if advisable or not]
`.trim() : '';

  // Advanced mode: if a model is provided and Ollama is online, answer ANY question via LLM using the real context
  try {
    const ollamaOnline = await checkOllamaStatus();
    if (model && ollamaOnline) {
      const llmPrompt = `You are a personal finance assistant analyzing a user's actual financial data from their money management app.

${baseContext}

${instructions}
${purchaseBlock}

User Question: ${message}`;
      const llmResponse = await queryLLM(llmPrompt, { max_tokens: 250, model });
      return llmResponse;
    }
  } catch (error) {
    console.error('LLM/Ollama check error:', error);
    // Fall through to basic mode handlers
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

  // Largest expense this month
  if (message.includes('largest expense') || message.includes('biggest expense')) {
    if (expenses.length === 0) {
      return 'No expenses recorded this month.';
    }
    const top = expenses.slice().sort((a, b) => b.amount - a.amount)[0];
    return `Largest expense: $${top.amount.toFixed(2)} for ${top.categoryId?.name || 'Other'} (${top.description || 'no description'}).`;
  }

  // Average transaction size
  if (message.includes('average expense') || message.includes('avg expense') || message.includes('average transaction')) {
    if (expenses.length === 0) {
      return 'No expenses recorded this month.';
    }
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const avg = total / expenses.length;
    return `Average expense amount this month: $${avg.toFixed(2)} across ${expenses.length} transactions.`;
  }

  // Category breakdown
  if (message.includes('category breakdown') || message.includes('spending by category')) {
    if (expenses.length === 0) {
      return 'No expenses recorded this month.';
    }
    const byCategory = {};
    expenses.forEach(e => {
      const name = e.categoryId?.name || 'Uncategorized';
      byCategory[name] = (byCategory[name] || 0) + e.amount;
    });
    const lines = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amt]) => `  • ${name}: $${amt.toFixed(2)}`)
      .join('\n');
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    return `Spending by category (this month, total $${total.toFixed(2)}):\n${lines}`;
  }

  // Income sources breakdown
  if (message.includes('income breakdown') || message.includes('income sources')) {
    const incomes = await Income.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    }).populate('categoryId');
    if (incomes.length === 0) {
      return 'No income recorded this month.';
    }
    const byCategory = {};
    incomes.forEach(i => {
      const name = i.categoryId?.name || 'Income';
      byCategory[name] = (byCategory[name] || 0) + i.amount;
    });
    const lines = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amt]) => `  • ${name}: $${amt.toFixed(2)}`)
      .join('\n');
    const total = incomes.reduce((s, i) => s + i.amount, 0);
    return `Income breakdown (this month, total $${total.toFixed(2)}):\n${lines}`;
  }

  // Debt payoff priority (highest interest first)
  if (message.includes('payoff priority') || message.includes('which debt first')) {
    const debts = await Debt.find({ userId });
    if (debts.length === 0) {
      return 'You have no debts recorded.';
    }
    const sorted = debts.slice().sort((a, b) => b.interestRate - a.interestRate);
    const lines = sorted.map(d => `  • ${d.name}: $${d.currentBalance.toFixed(2)} at ${d.interestRate}%`).join('\n');
    return `Payoff priority (highest interest first):\n${lines}\nTip: Target the top entry for fastest interest savings.`;
  }

  // Budget utilization
  if (message.includes('budget breakdown') || message.includes('budget utilization')) {
    const budgets = await Budget.find({ userId }).populate('categoryId');
    if (budgets.length === 0) {
      return 'No budgets set up.';
    }
    const active = budgets.filter(b => b.period === 'monthly');
    const lines = active.map(b => `  • ${b.categoryId?.name || 'Category'}: ${b.percentageUsed?.toFixed(1) || 0}% used`).join('\n');
    return `Budget utilization (monthly):\n${lines}`;
  }

  // Cash runway (months of expenses covered by current funds)
  if (message.includes('runway') || message.includes('months of expenses')) {
    const months = monthlyExpenseAvg > 0 ? totalSavings / monthlyExpenseAvg : null;
    return months === null
      ? 'No expenses recorded this month to compute runway.'
      : `Current funds cover ~${months.toFixed(1)} months of expenses.`;
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

    const highestInterest = debts.slice().sort((a, b) => b.interestRate - a.interestRate)[0];

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

  // Emergency fund guidance
  if (message.includes('emergency fund') || message.includes('rainy day') || message.includes('3-6 months')) {
    const requiredMin = monthlyExpenseAvg * 3;
    const requiredMax = monthlyExpenseAvg * 6;
    const gapMin = requiredMin - totalSavings;
    const gapMax = requiredMax - totalSavings;
    return `Emergency fund target: $${requiredMin.toFixed(2)}–$${requiredMax.toFixed(2)} (3–6 months of expenses).
Current savings: $${totalSavings.toFixed(2)}.
${gapMin > 0 ? `You’re short by ~$${gapMin.toFixed(2)} for 3 months and ~$${gapMax.toFixed(2)} for 6 months. Consider allocating a portion of monthly savings until you reach this range.` : 'You’ve met the 3-month baseline. Consider aiming for 6 months for stronger resilience.'}`;
  }

  // Subscription audit (detect recurring expenses by description keywords)
  if (message.includes('subscription') || message.includes('recurring')) {
    const subs = expenses.filter(e => /subscription|netflix|spotify|prime|apple|google|saas|monthly/i.test(`${e.description || ''} ${e.categoryId?.name || ''}`));
    const totalSubs = subs.reduce((s, e) => s + e.amount, 0);
    if (subs.length === 0) {
      return 'No obvious subscriptions detected this month. Review your expenses to confirm recurring charges.';
    }
    const list = subs.map(e => `  • ${e.categoryId?.name || 'Subscription'}: $${e.amount.toFixed(2)} (${e.description || 'no description'})`).join('\n');
    return `This month, subscriptions total $${totalSubs.toFixed(2)} across ${subs.length} charge(s):\n${list}\nTip: Cancel unused subscriptions or switch to annual plans if cheaper.`;
  }

  // Savings goal projection
  if (message.includes('savings goal') || message.includes('goal') || message.includes('save for')) {
    const netSavingsMonthly = Math.max(0, monthlyIncomeAvg - monthlyExpenseAvg);
    const amountMatch = message.match(/\$?\s*([\d,.]+)\s*(million|billion|thousand|m|b|k)?/i);
    let target = null;
    if (amountMatch) {
      const num = parseFloat(amountMatch[1].replace(/,/g, ''));
      const unit = (amountMatch[2] || '').toLowerCase();
      const scale = unit === 'million' || unit === 'm' ? 1_000_000 : unit === 'billion' || unit === 'b' ? 1_000_000_000 : unit === 'thousand' || unit === 'k' ? 1_000 : 1;
      target = num * scale;
    }
    if (!Number.isFinite(target) || target <= 0) {
      return `Tell me the target (e.g., "savings goal $5,000"). Based on your month: income $${monthlyIncomeAvg.toFixed(2)}, expenses $${monthlyExpenseAvg.toFixed(2)}, estimated monthly savings $${netSavingsMonthly.toFixed(2)}.`;
    }
    const months = netSavingsMonthly > 0 ? target / netSavingsMonthly : Infinity;
    return `Goal: $${target.toFixed(2)}. Estimated monthly savings: $${netSavingsMonthly.toFixed(2)}.\nTime to reach: ${months === Infinity ? 'No savings (increase surplus to hit the goal)' : `${months.toFixed(1)} months`}. Consider automating transfers to stay consistent.`;
  }

  // Net worth and projection
  if (message.includes('net worth') || message.includes('projection')) {
    const netWorth = totalSavings - totalDebt;
    const netSavingsMonthly = monthlyIncomeAvg - monthlyExpenseAvg;
    const months = 12;
    const projected = netWorth + Math.max(0, netSavingsMonthly) * months;
    return `Current net worth: $${netWorth.toFixed(2)} (assets minus debts).\nProjected (12 months at current surplus): $${projected.toFixed(2)}.\nNote: This simple projection excludes investment returns or changes to debts.`;
  }

  // Budget recommendation
  if (message.includes('recommend budget') || message.includes('budget recommendation')) {
    const needs = monthlyExpenseAvg * 0.5;
    const wants = monthlyExpenseAvg * 0.3;
    const savings = monthlyExpenseAvg * 0.2;
    return `50/30/20 guideline for this month: Needs ~$${needs.toFixed(2)}, Wants ~$${wants.toFixed(2)}, Savings/Debt ~$${savings.toFixed(2)}. Adjust categories to align near these targets.`;
  }

  // Income vs expense trend (this month summary)
  if (message.includes('trend') || message.includes('income vs expense')) {
    const surplus = monthlyIncomeAvg - monthlyExpenseAvg;
    return `This month: income $${monthlyIncomeAvg.toFixed(2)} vs expenses $${monthlyExpenseAvg.toFixed(2)}. Net ${surplus >= 0 ? 'surplus' : 'deficit'}: $${Math.abs(surplus).toFixed(2)}.`;
  }

  // Cash flow improvement plan (rule-based fallback when LLM is unavailable)
  if (message.includes('outline') || message.includes('plan') || message.includes('steps') || message.includes('improve cash flow')) {
    const surplus = monthlyIncomeAvg - monthlyExpenseAvg;
    const targetCut = Math.max(0, monthlyExpenseAvg * 0.1);
    const extraDebtPay = Math.min(Math.max(0, surplus), totalSavings * 0.05);
    return [
      '3-step cash flow plan:',
      `1) Reduce discretionary categories by ~$${targetCut.toFixed(2)} this month (aim ~10% cut across non-essential spending).`,
      `2) Make an extra debt payment of ~$${extraDebtPay.toFixed(2)} toward highest-interest debt to lower future interest costs.`,
      `3) Pause or downgrade subscriptions and set a weekly review to keep total monthly expenses under $${(monthlyExpenseAvg - targetCut).toFixed(2)}.`
    ].join('\n');
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
