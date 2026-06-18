const { getOrCreateSettings } = require('./platformSettings');

const defaultTemplates = {
  passwordResetOtp: {
    subject: 'Your HireFlow password reset OTP',
    body: 'Hello {{name}},\n\nYour password reset OTP is {{otp}}.\nThis OTP expires in {{minutes}} minutes.\n\nIf you did not request this, you can ignore this email.\n\n{{siteName}}',
  },
  registrationOtp: {
    subject: 'Verify your HireFlow account',
    body: 'Hello {{name}},\n\nYour HireFlow verification code is {{otp}}.\nThis code expires in {{minutes}} minutes.\n\nIf you did not request this account, you can ignore this email.\n\n{{siteName}}',
  },
  applicationSubmitted: {
    subject: 'Application submitted for {{jobTitle}}',
    body: 'Hello {{candidateName}},\n\nYour application for {{jobTitle}} at {{company}} has been submitted successfully.\n\n{{siteName}}',
  },
  applicationReceived: {
    subject: 'New application received for {{jobTitle}}',
    body: 'Hello {{recruiterName}},\n\n{{candidateName}} applied for {{jobTitle}}.\n\nPlease review the application in your recruiter workspace.\n\n{{siteName}}',
  },
  applicationShortlisted: {
    subject: 'You have been shortlisted for {{jobTitle}}',
    body: 'Hello {{candidateName}},\n\nGood news. Your application for {{jobTitle}} at {{company}} has been shortlisted.\n\nPlease keep an eye on your dashboard for the next update.\n\n{{siteName}}',
  },
  applicationRejected: {
    subject: 'Update on your application for {{jobTitle}}',
    body: 'Hello {{candidateName}},\n\nThank you for applying for {{jobTitle}} at {{company}}.\n\nAfter review, your application was not selected for this role. We encourage you to keep exploring new opportunities on {{siteName}}.\n\n{{siteName}}',
  },
  supportReply: {
    subject: 'Support ticket updated: {{subject}}',
    body: 'Hello {{name}},\n\nAdmin replied to your support ticket: {{subject}}.\n\n{{message}}\n\n{{siteName}}',
  },
};

const renderTemplate = (template = '', data = {}) =>
  String(template).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const value = key.split('.').reduce((current, part) => current?.[part], data);
    return value === undefined || value === null ? '' : String(value);
  });

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const textToHtml = (value = '') =>
  String(value)
    .split('\n')
    .map((line) => `<p style="margin:0 0 14px">${line ? escapeHtml(line) : '&nbsp;'}</p>`)
    .join('');

const buildEmailHtml = ({ subject, text, settings, actionText, actionUrl }) => {
  const siteName = escapeHtml(settings.general?.siteName || 'HireFlow');
  const supportEmail = settings.general?.supportEmail || process.env.SMTP_USER || '';
  const primaryColor = settings.branding?.primaryColor || '#2563eb';
  const secondaryColor = settings.branding?.secondaryColor || '#0f172a';
  const logoUrl = settings.branding?.logoUrl || '';
  const logoImage = /^https?:\/\//i.test(logoUrl)
    ? `<img src="${escapeHtml(logoUrl)}" alt="${siteName}" width="42" height="42" style="display:block;border-radius:10px;object-fit:cover;">`
    : `<div style="width:42px;height:42px;border-radius:10px;background:${primaryColor};color:#ffffff;font-weight:800;font-size:16px;line-height:42px;text-align:center;">HI</div>`;
  const safeSubject = escapeHtml(subject);
  const bodyHtml = textToHtml(text);
  const buttonHtml = actionText && actionUrl
    ? `
      <tr>
        <td style="padding:8px 0 6px;">
          <a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:${primaryColor};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;border-radius:6px;padding:13px 20px;">
            ${escapeHtml(actionText)}
          </a>
        </td>
      </tr>`
    : '';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${safeSubject}</title>
  </head>
  <body style="margin:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:${secondaryColor};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safeSubject}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6fb;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:${secondaryColor};padding:28px 30px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="52">${logoImage}</td>
                    <td>
                      <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:0;">${siteName}</div>
                      <div style="color:#bfdbfe;font-size:13px;margin-top:4px;">Job portal updates</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 30px 26px;">
                <h1 style="margin:0 0 18px;font-size:24px;line-height:1.3;color:${secondaryColor};">${safeSubject}</h1>
                <div style="font-size:15px;line-height:1.7;color:#334155;">${bodyHtml}</div>
                <table role="presentation" cellspacing="0" cellpadding="0">${buttonHtml}</table>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 30px;color:#64748b;font-size:12px;line-height:1.6;">
                <strong style="color:${secondaryColor};">${siteName}</strong><br>
                This email was sent automatically by ${siteName}.
                ${supportEmail ? `<br>Need help? Contact ${escapeHtml(supportEmail)}.` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const getEmailSettings = (settings) => {
  const emailSettings = settings.email || {};
  const smtpUser = process.env.SMTP_USER || emailSettings.smtpUser || '';
  const configuredFromEmail = process.env.EMAIL_FROM || emailSettings.fromEmail || '';
  const fromEmail = configuredFromEmail && configuredFromEmail !== 'no-reply@hireflow.com'
    ? configuredFromEmail
    : smtpUser;

  return {
    ...emailSettings,
    provider: process.env.EMAIL_PROVIDER || emailSettings.provider || 'smtp',
    fromName: process.env.EMAIL_FROM_NAME || emailSettings.fromName || settings.general?.siteName || 'HireFlow',
    fromEmail,
    smtpHost: process.env.SMTP_HOST || emailSettings.smtpHost || 'smtp.gmail.com',
    smtpPort: Number(process.env.SMTP_PORT || emailSettings.smtpPort || 465),
    smtpSecure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE !== 'false'
      : emailSettings.smtpSecure !== false,
    smtpUser,
    smtpPassword: process.env.SMTP_PASSWORD || process.env.SMTP_PASS || emailSettings.smtpPassword || '',
  };
};

const createTransporter = (emailSettings) => {
let nodemailer;
const { logEvent } = require('./systemLogger');
  try {
    // Optional dependency so the server can show a clear setup error if it is missing.
    // eslint-disable-next-line global-require
    nodemailer = require('nodemailer');
  } catch {
    throw new Error('Email service needs nodemailer. Run npm install in the backend folder.');
  }

  if (!emailSettings.smtpHost || !emailSettings.smtpUser || !emailSettings.smtpPassword) {
    throw new Error('SMTP host, user, and password are required in admin email settings.');
  }

  return nodemailer.createTransport({
    host: emailSettings.smtpHost,
    port: emailSettings.smtpPort,
    secure: emailSettings.smtpSecure,
    auth: {
      user: emailSettings.smtpUser,
      pass: emailSettings.smtpPassword,
    },
  });
};

const sendEmail = async ({ to, subject, text, html, actionText, actionUrl }) => {
  const settings = await getOrCreateSettings();
  const emailSettings = getEmailSettings(settings);

  if (emailSettings.provider !== 'smtp') {
    throw new Error('Only SMTP email provider is currently supported.');
  }

  const transporter = createTransporter(emailSettings);
  const fromEmail = emailSettings.fromEmail || emailSettings.smtpUser;
  const fromName = emailSettings.fromName || settings.general?.siteName || 'HireFlow';

  return transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    text,
    html: html || buildEmailHtml({ subject, text, settings, actionText, actionUrl }),
  });
};

const sendTemplateEmail = async (eventKey, to, data = {}) => {
  const settings = await getOrCreateSettings();
  const emailSettings = settings.email || {};

  if (!to) {
    return { skipped: true, reason: 'missing_recipient' };
  }

  if (emailSettings.events?.[eventKey] === false) {
    return { skipped: true, reason: 'disabled' };
  }

  const template = emailSettings.templates?.[eventKey] || defaultTemplates[eventKey];
  if (!template) {
    return { skipped: true, reason: 'missing_template' };
  }

  const templateData = {
    siteName: settings.general?.siteName || 'HireFlow',
    supportEmail: settings.general?.supportEmail || '',
    ...data,
  };
  const subject = renderTemplate(template.subject, templateData);
  const text = renderTemplate(template.body, templateData);

  try {
    return await sendEmail({
      to,
      subject,
      text,
      actionText: data.actionText,
      actionUrl: data.actionUrl,
    });
  } catch (error) {
    await logEvent({
      action: 'email.send_failed',
      category: 'email',
      severity: 'error',
      message: `Failed to send ${eventKey} email`,
      metadata: {
        eventKey,
        to,
        reason: error.message,
      },
    });
    throw error;
  }
};

module.exports = {
  buildEmailHtml,
  defaultTemplates,
  getEmailSettings,
  renderTemplate,
  sendEmail,
  sendTemplateEmail,
};
