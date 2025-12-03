const Debt = require('../models/Debt');
const User = require('../models/User');
const { sendDebtReminderEmail } = require('./emailService');
const { createDebtDueSoonNotification, createDebtOverdueNotification } = require('./notifications');

/**
 * Check all active debts and send reminders for upcoming payments
 * This function should be called daily (e.g., via a cron job or scheduler)
 */
async function checkAndSendDebtReminders() {
  try {
    console.log('\n🔔 Starting debt reminder check...');
    
    // Find all active debts with reminders enabled
    const debts = await Debt.find({
      status: 'active',
      reminderEnabled: true
    }).populate('userId', 'name email');

    if (debts.length === 0) {
      console.log('No active debts with reminders enabled.');
      return { sent: 0, skipped: 0 };
    }

    const today = new Date();
    let sentCount = 0;
    let skippedCount = 0;

    for (const debt of debts) {
      const nextPayment = debt.nextPaymentDate;
      if (!nextPayment || !debt.userId) {
        skippedCount++;
        continue;
      }

      const daysUntilDue = Math.ceil((nextPayment - today) / (1000 * 60 * 60 * 24));
      
      // Check if we should send a reminder
      if (daysUntilDue <= debt.reminderDaysBefore && daysUntilDue >= 0) {
        try {
          // Create in-app notification
          await createDebtDueSoonNotification(
            debt.userId._id,
            debt.name,
            nextPayment.toLocaleDateString(),
            debt.minimumPayment,
            daysUntilDue
          );

          // Send email notification
          await sendDebtReminderEmail(
            debt.userId.email,
            debt.userId.name,
            debt.name,
            nextPayment.toLocaleDateString(),
            debt.minimumPayment
          );

          sentCount++;
          console.log(`✓ Sent reminder for ${debt.name} to ${debt.userId.email}`);
        } catch (error) {
          console.error(`✗ Failed to send reminder for ${debt.name}:`, error.message);
          skippedCount++;
        }
      }
      // Check for overdue debts
      else if (daysUntilDue < 0) {
        try {
          const daysOverdue = Math.abs(daysUntilDue);
          
          await createDebtOverdueNotification(
            debt.userId._id,
            debt.name,
            debt.minimumPayment,
            daysOverdue
          );

          sentCount++;
          console.log(`⚠ Sent overdue notice for ${debt.name} to ${debt.userId.email}`);
        } catch (error) {
          console.error(`✗ Failed to send overdue notice for ${debt.name}:`, error.message);
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }

    console.log(`\n✅ Debt reminder check complete:`);
    console.log(`   - Reminders sent: ${sentCount}`);
    console.log(`   - Skipped: ${skippedCount}`);
    console.log(`   - Total debts checked: ${debts.length}\n`);

    return { sent: sentCount, skipped: skippedCount };
  } catch (error) {
    console.error('Error in debt reminder scheduler:', error);
    throw error;
  }
}

/**
 * Initialize the debt reminder scheduler
 * Call this function when the server starts
 */
function initializeDebtReminderScheduler() {
  // Run immediately on startup
  console.log('🚀 Initializing debt reminder scheduler...');
  
  // Run check once at startup (after a 5 second delay to let server initialize)
  setTimeout(() => {
    checkAndSendDebtReminders().catch(err => 
      console.error('Error in initial debt reminder check:', err)
    );
  }, 5000);

  // Schedule to run daily at 9:00 AM
  // Calculate milliseconds until next 9:00 AM
  const scheduleDaily = () => {
    const now = new Date();
    const next9AM = new Date();
    next9AM.setHours(9, 0, 0, 0);
    
    // If it's already past 9 AM today, schedule for 9 AM tomorrow
    if (now >= next9AM) {
      next9AM.setDate(next9AM.getDate() + 1);
    }
    
    const msUntilNext9AM = next9AM - now;
    
    setTimeout(() => {
      checkAndSendDebtReminders().catch(err => 
        console.error('Error in scheduled debt reminder check:', err)
      );
      
      // Schedule next run in 24 hours
      setInterval(() => {
        checkAndSendDebtReminders().catch(err => 
          console.error('Error in scheduled debt reminder check:', err)
        );
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, msUntilNext9AM);
    
    console.log(`⏰ Next debt reminder check scheduled for: ${next9AM.toLocaleString()}`);
  };

  scheduleDaily();
}

module.exports = {
  checkAndSendDebtReminders,
  initializeDebtReminderScheduler
};
