// Email Service Utility
// Sends real emails if SMTP env vars are set; otherwise logs to console (test mode)

const nodemailer = require('nodemailer');

const buildTransporter = () => {
  // Prefer generic SMTP configuration for portability
  const host = process.env.EMAIL_HOST; // e.g., smtp.gmail.com, smtp.sendgrid.net
  const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587;
  const secure = process.env.EMAIL_SECURE === 'true'; // true for 465, false for 587
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (host && user && pass) {
    return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  }

  // Fallback: try gmail shortcut if only user/pass provided
  if (user && pass) {
    return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  }

  return null; // no SMTP configured
};

const transporter = buildTransporter();

const sendEmail = async (to, subject, htmlContent, textContent) => {
  try {
    // If transporter not configured, log (test mode)
    if (!transporter) {
      console.log('\n ===== EMAIL NOTIFICATION (TEST MODE) =====');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content:\n${textContent || htmlContent}`);
      console.log('Set EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASSWORD to send real emails.');
      console.log('==========================================\n');
      return { success: true, message: 'Email logged (test mode)' };
    }

    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: textContent,
      html: htmlContent
    });

    return { success: true, message: 'Email sent', id: info.messageId }; 
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};

const sendDebtReminderEmail = async (userEmail, userName, debtName, dueDate, amount) => {
  const subject = `💳 Payment Reminder: ${debtName}`;
  const textContent = `
Hi ${userName},

This is a friendly reminder that your payment for ${debtName} is due soon.

Due Date: ${dueDate}
Minimum Payment: $${amount}

Don't forget to make your payment on time to avoid late fees!

Best regards,
Money Manager Team
  `;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #EF4444;">💳 Payment Reminder</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>This is a friendly reminder that your payment for <strong>${debtName}</strong> is due soon.</p>
      <div style="background-color: #FEE2E2; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDate}</p>
        <p style="margin: 5px 0;"><strong>Minimum Payment:</strong> $${amount}</p>
      </div>
      <p>Don't forget to make your payment on time to avoid late fees!</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
      <p style="color: #6B7280; font-size: 12px;">Best regards,<br>Money Manager Team</p>
    </div>
  `;

  return await sendEmail(userEmail, subject, htmlContent, textContent);
};

const sendBudgetExceededEmail = async (userEmail, userName, categoryName, budgetAmount, spentAmount) => {
  const subject = `Budget Alert: ${categoryName}`;
  const exceededBy = spentAmount - budgetAmount;
  const percentage = ((spentAmount / budgetAmount) * 100).toFixed(1);

  const textContent = `
Hi ${userName},

Your spending in the ${categoryName} category has exceeded your budget!

Budget: $${budgetAmount}
Spent: $${spentAmount}
Exceeded by: $${exceededBy} (${percentage}%)

Consider reviewing your expenses in this category.

Best regards,
Money Manager Team
  `;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #F59E0B;">Budget Alert</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>Your spending in the <strong>${categoryName}</strong> category has exceeded your budget!</p>
      <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Budget:</strong> $${budgetAmount}</p>
        <p style="margin: 5px 0;"><strong>Spent:</strong> $${spentAmount}</p>
        <p style="margin: 5px 0; color: #DC2626;"><strong>Exceeded by:</strong> $${exceededBy} (${percentage}%)</p>
      </div>
      <p>Consider reviewing your expenses in this category to get back on track.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
      <p style="color: #6B7280; font-size: 12px;">Best regards,<br>Money Manager Team</p>
    </div>
  `;

  return await sendEmail(userEmail, subject, htmlContent, textContent);
};

module.exports = {
  sendEmail,
  sendDebtReminderEmail,
  sendBudgetExceededEmail
};
