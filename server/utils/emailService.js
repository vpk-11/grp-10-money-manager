// Email Service for Money Manager
// TEST MODE - Emails logged to console only

const sendEmail = async ({ to, subject, text, html }) => {
  // In TEST MODE - just log to console
  console.log('\n========== EMAIL NOTIFICATION (TEST MODE) ==========');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Text Content:', text);
  if (html) {
    console.log('HTML Content:', html);
  }
  console.log('====================================================\n');
  
  return {
    success: true,
    messageId: `test-${Date.now()}`,
    mode: 'TEST'
  };
};

const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to Money Manager!';
  const text = `Hi ${user.name},\n\nWelcome to Money Manager! Your account has been successfully created.\n\nEmail: ${user.email}\n\nGet started by logging in and tracking your finances.\n\nBest regards,\nMoney Manager Team`;
  
  return await sendEmail({
    to: user.email,
    subject,
    text
  });
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const subject = 'Password Reset Request';
  const text = `Hi ${user.name},\n\nYou requested a password reset. Use the token below:\n\nReset Token: ${resetToken}\n\nThis token expires in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nMoney Manager Team`;
  
  return await sendEmail({
    to: user.email,
    subject,
    text
  });
};

const sendBudgetAlertEmail = async (user, budgetInfo) => {
  const subject = `Budget Alert: ${budgetInfo.category}`;
  const text = `Hi ${user.name},\n\nYour budget for "${budgetInfo.category}" has reached ${budgetInfo.percentage}% of the limit.\n\nSpent: $${budgetInfo.spent}\nBudget: $${budgetInfo.limit}\n\nConsider reviewing your spending in this category.\n\nBest regards,\nMoney Manager Team`;
  
  return await sendEmail({
    to: user.email,
    subject,
    text
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBudgetAlertEmail
};
