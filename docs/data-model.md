# Data Model Snapshot (Sample Tables)

Below are sample tables for key entities. Replace values with real data as needed or open `/snapshot` in the app to capture screenshots.

## Users

| Name      | Email            | Currency | Last Login           |
|-----------|------------------|----------|----------------------|
| John Doe  | john@example.com | USD      | 2025-12-07T00:00:00Z |

## Accounts

| Name           | Type        | Balance   | Currency |
|----------------|-------------|-----------|----------|
| Main Checking  | checking    | 5420.50   | USD      |
| Savings Account| savings     | 12350.00  | USD      |
| Credit Card    | credit      | -1285.75  | USD      |
| Cash Wallet    | cash        | 250.00    | USD      |

## Expense Categories

| Name        | Color  | Budget Limit |
|-------------|--------|--------------|
| Groceries     | #10B981 | 600.00       |
| Rent          | #3B82F6 | 1500.00      |
| Utilities     | #F59E0B | 200.00       |
| Transportation | #6366F1 | 300.00       |
| Entertainment  | #EC4899 | 200.00       |
| Dining Out     | #EF4444 | 300.00       |
| Healthcare     | #14B8A6 | 150.00       |
| Shopping       | #8B5CF6 | 250.00       |
| Education      | #F97316 | 200.00       |
| Insurance      | #06B6D4 | 300.00       |

## Income Categories

| Name        | Color  |
|-------------|--------|
| Salary      | #10B981|
| Freelance   | #3B82F6|
| Investment  | #8B5CF6|
| Bonus       | #F59E0B|
| Other       | #6B7280|

## Expenses

| Amount  | Date       | Description           | Category     | Account        |
|---------|------------|-----------------------|--------------|----------------|
| 1500.00 | 1st of month | Monthly rent payment  | Rent         | Main Checking  |
| 180.00  | 5th of month | Electric and water bill| Utilities   | Main Checking  |
| 250.00  | 1st of month | Health insurance premium| Insurance  | Main Checking  |
| 110.00  | weekly       | Weekly grocery shopping| Groceries   | Main Checking/Credit |
| 45.00   | random days  | Lunch/Dinner/Brunch    | Dining Out  | Credit Card    |
| 55.00   | random days  | Gas station fill-up    | Transportation| Main Checking |
| 30.00   | random days  | Movie/Streaming/Gaming | Entertainment| Credit Card    |
| 120.00  | occasional   | New clothes/electronics | Shopping    | Credit Card    |
| 60.00   | occasional   | Doctor/Prescription     | Healthcare  | Main Checking  |

## Incomes

| Amount  | Date       | Source     | Category  | Account       |
|---------|------------|------------|-----------|---------------|
| 4500.00 | 1st monthly | Monthly salary | Salary    | Main Checking |
| 800-1300| 15th (alt months) | Freelance project | Freelance | Main Checking |

## Budgets

| Amount | Period   | % Used | Exceeded | Category     |
|--------|----------|--------|----------|--------------|
| 600.00 | monthly  | 58.3   | false    | Groceries    |
| 300.00 | monthly  | 81.7   | true     | Dining Out   |
| 300.00 | monthly  | 81.7   | true     | Transportation|
| 200.00 | monthly  | 62.5   | false    | Entertainment|
| 250.00 | monthly  | 72.0   | false    | Shopping     |

## Debts

| Name                | Current Balance | Interest % | Due Date    |
|---------------------|-----------------|------------|-------------|
| Student Loan - Federal | 28500.00 | 4.50 | Due day 15 |
| Credit Card - Visa     | 1285.00  | 18.90| Due day 25 |
| Auto Loan              | 12400.00 | 5.20 | Due day 5  |

## Notifications

| Type     | Title                         | Priority | Read | Created              |
|----------|-------------------------------|----------|------|----------------------|
| budget   | Budget Exceeded: Entertainment| high     | false| 2025-12-16T08:12:00Z |
| debt     | Payment Due: Credit Card      | high     | true | 2025-12-05T09:00:00Z |
| info     | Weekly Summary Ready          | normal   | true | 2025-12-01T07:30:00Z |

---

Tip: For screenshots with real data, open `http://localhost:5173/snapshot` (logged in) or `http://localhost:5173/snapshot-public` and capture the rendered tables.