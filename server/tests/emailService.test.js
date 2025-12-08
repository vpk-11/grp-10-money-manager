// Helper to load module fresh per test with desired env and transporter mock
const loadService = (sendMailImpl = jest.fn()) => {
  jest.resetModules();
  jest.doMock('nodemailer', () => ({
    createTransport: jest.fn(() => ({ sendMail: sendMailImpl }))
  }));

  // eslint-disable-next-line global-require
  const service = require('../utils/emailService');
  // eslint-disable-next-line global-require
  const nodemailer = require('nodemailer');
  return { service, nodemailer };
};

describe('emailService', () => {
  const originalEnv = { ...process.env };
  let sendMail;
  let sendEmail;

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
    jest.restoreAllMocks();
    sendMail = undefined;
    sendEmail = undefined;
  });

  test('logs email when transporter is not configured', async () => {
    process.env = { ...originalEnv }; // ensure no SMTP vars
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const { service } = loadService();
    const result = await service.sendEmail('to@test.com', 'Hi', '<p>Hello</p>', 'Hello');

    expect(result.success).toBe(true);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('===== EMAIL NOTIFICATION ====='));
    logSpy.mockRestore();
  });

  test('sends via SMTP when configured', async () => {
    sendMail = jest.fn().mockResolvedValue({ messageId: '123' });
    process.env = {
      ...originalEnv,
      EMAIL_HOST: 'smtp.test.com',
      EMAIL_USER: 'user@test.com',
      EMAIL_PASSWORD: 'pass',
      EMAIL_PORT: '465',
      EMAIL_SECURE: 'true'
    };

    const { service } = loadService(sendMail);
    const result = await service.sendEmail('to@test.com', 'Hello', '<p>Hi</p>', 'Hi');

    expect(sendMail).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.id).toBe('123');
  });

  test('returns failure when transporter throws', async () => {
    sendMail = jest.fn().mockRejectedValue(new Error('smtp fail'));
    process.env = {
      ...originalEnv,
      EMAIL_USER: 'user@test.com',
      EMAIL_PASSWORD: 'pass'
    };

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { service } = loadService(sendMail);
    const result = await service.sendEmail('to@test.com', 'Hello', '<p>Hi</p>', 'Hi');
    errorSpy.mockRestore();

    expect(sendMail).toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/smtp fail/);
  });
});
