import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
  pool: true,
  maxConnections: 5,
  maxMessages: 100
});

transporter.verify((error) => {
  if (error) {
    console.error('SMTP Connection Error:', {
      message: error.message,
      code: error.code,
      command: error.command,
    });
  } else {
    console.log('SMTP Server is ready to take our messages');
  }
});

const logoPath = path.join(__dirname, '..', 'public', 'cics.png');
const attachment = [{ filename: 'cics.png', path: logoPath, cid: 'cics-logo' }];

const shell = (bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MSU CICS</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Poppins','Inter',Arial,sans-serif;color:#1e1b4b;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background-color:#f8fafc;padding:48px 20px;">
    <tr><td align="center">

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="max-width:520px;margin-bottom:28px;">
        <tr>
          <td align="center">
            <img src="cid:cics-logo" alt="CICS Logo" width="80" height="80"
              style="border-radius:24px;display:block;margin:0 auto 14px;
                     box-shadow:0 8px 24px rgba(47,49,141,0.12);" />
            <p style="margin:0;font-size:11px;font-weight:800;color:#2f318d;
                      text-transform:uppercase;letter-spacing:0.15em;opacity:0.8;">
              CICS E-Voting System
            </p>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="max-width:520px;background:#ffffff;border-radius:40px;
               border:1px solid #e2e8f0;
               box-shadow:0 20px 40px rgba(47,49,141,0.06);">

        <tr>
          <td style="height:5px;background:linear-gradient(90deg,#2f318d,#4f52c8,#2f318d);
                     border-radius:40px 40px 0 0;"></td>
        </tr>

        ${bodyContent}

        <tr>
          <td style="padding:0 40px 36px;" align="center">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="border-top:1px solid #f1f5f9;padding-top:24px;" align="center">
                  <p style="margin:0;font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:0.04em;">
                    © 2026 MSU College of Information and Computing Sciences
                  </p>
                  <p style="margin:6px 0 0;font-size:11px;color:#cbd5e1;letter-spacing:0.02em;">
                    This is an automated message — please do not reply.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;

export const sendVoteEmail = async (userEmail, userName, electionName, votes) => {

  const voteRows = votes.map((v) => `
        <tr>
          <td style="padding-bottom:10px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:#ffffff;border-radius:20px;
                     box-shadow:0 2px 8px rgba(47,49,141,0.04);">
              <tr>
                <td style="padding:14px 24px;">
                  <p style="margin:0 0 3px;font-size:10px;font-weight:700;color:#94a3b8;
                            text-transform:uppercase;letter-spacing:0.12em;">${v.positionName}</p>
                  <p style="margin:0;font-size:16px;font-weight:800;color:#2f318d;
                            letter-spacing:-0.01em;">${v.candidateName}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
    `).join('');

  const bodyContent = `
        <tr>
          <td style="padding:36px 40px 0;">

            <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
              <tr>
                <td width="52" height="52"
                  style="background:#dcfce7;border-radius:16px;text-align:center;
                         line-height:52px;font-size:22px;">✓</td>
                <td style="padding-left:14px;">
                  <p style="margin:0;font-size:18px;font-weight:800;color:#1e292b;
                            letter-spacing:-0.02em;">Ballot Confirmed</p>
                  <p style="margin:2px 0 0;font-size:13px;color:#64748b;">${electionName}</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.65;">
              Hi <strong style="color:#1e292b;">${userName}</strong>, your ballot has been
              <strong style="color:#2f318d;">securely recorded</strong>. This email serves as
              your official cryptographic receipt.
            </p>

            <p style="margin:0 0 12px;font-size:11px;font-weight:800;color:#94a3b8;
                      text-transform:uppercase;letter-spacing:0.12em;
                      border-bottom:1px solid #f1f5f9;padding-bottom:10px;">
              Your Selections
            </p>

          </td>
        </tr>

        <tr>
          <td style="padding:0 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              ${voteRows}
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:24px;">
              <tr>
                <td style="padding:18px 22px;text-align:center;">
                  <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                    Your vote is <strong style="color:#475569;">anonymous and encrypted</strong>.
                    Individual selections cannot be traced back to you.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
    `;

  return transporter.sendMail({
    from: `"MSU CICS Elections" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: `Ballot Receipt: ${electionName}`,
    html: shell(bodyContent),
    attachments: attachment,
  });
};

export const sendStatusEmail = async (userEmail, userName, action) => {
  const isApproved = action === 'approved';
  const loginUrl = 'https://voting-system-1-rcb6.onrender.com/login';

  const bodyContent = isApproved ? `
        <tr>
          <td style="padding:36px 40px 0;">

            <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
              <tr>
                <td width="52" height="52"
                  style="background:#eef2ff;border-radius:16px;text-align:center;
                         line-height:52px;font-size:22px;">👤</td>
                <td style="padding-left:14px;">
                  <p style="margin:0;font-size:18px;font-weight:800;color:#1e292b;
                            letter-spacing:-0.02em;">Application Approved</p>
                  <p style="margin:2px 0 0;font-size:13px;color:#64748b;">MSU CICS Election Portal</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.65;">
              Hi <strong style="color:#1e292b;">${userName}</strong>, great news! Your registration
              has been <strong style="color:#2f318d;">approved</strong>. You are now authorized to
              vote. Please follow the instructions in the dashboard to cast your ballot.
            </p>

          </td>
        </tr>

        <tr>
          <td style="padding:0 40px 28px;" align="center">
            <a href="${loginUrl}"
              style="display:inline-block;background:#2f318d;color:#ffffff;
                     padding:16px 40px;border-radius:20px;text-decoration:none;
                     font-size:15px;font-weight:800;letter-spacing:0.02em;
                     box-shadow:0 10px 24px rgba(47,49,141,0.22);">
              Access Voter Dashboard →
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding:0 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:24px;">
              <tr>
                <td style="padding:18px 22px;text-align:center;">
                  <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                    Ballots are <strong style="color:#475569;">final and cannot be changed</strong>
                    once submitted. Review all instructions carefully before voting.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
    ` : `
        <tr>
          <td style="padding:36px 40px 0;">

            <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
              <tr>
                <td width="52" height="52"
                  style="background:#fee2e2;border-radius:16px;text-align:center;
                         line-height:52px;font-size:20px;font-weight:800;color:#dc2626;">✕</td>
                <td style="padding-left:14px;">
                  <p style="margin:0;font-size:18px;font-weight:800;color:#1e292b;
                            letter-spacing:-0.02em;">Application Not Approved</p>
                  <p style="margin:2px 0 0;font-size:13px;color:#64748b;">MSU CICS Election Portal</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.65;">
              Hi <strong style="color:#1e292b;">${userName}</strong>, your registration was
              <strong style="color:#dc2626;">not approved</strong>. To maintain system integrity,
              your application data has been removed from our temporary registry.
            </p>

          </td>
        </tr>

        <tr>
          <td style="padding:0 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:#fff1f2;border:1px solid #fecaca;border-radius:24px;">
              <tr>
                <td style="padding:22px 24px;">
                  <p style="margin:0 0 12px;font-size:11px;font-weight:800;color:#991b1b;
                            text-transform:uppercase;letter-spacing:0.1em;">Important Notice</p>
                  <p style="margin:0 0 8px;font-size:13px;color:#b91c1c;line-height:1.65;">
                    · You <strong>must enter your proper institutional credentials</strong> to register.
                  </p>
                  <p style="margin:0 0 8px;font-size:13px;color:#b91c1c;line-height:1.65;">
                    · Strictly <strong>follow the registration instructions</strong> provided in the portal.
                  </p>
                  <p style="margin:0;font-size:13px;color:#b91c1c;line-height:1.65;">
                    · Contact your administrator if you believe this is an error.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
    `;

  return transporter.sendMail({
    from: `"MSU CICS Membership" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: isApproved
      ? 'Application Approved – MSU CICS'
      : 'Application Status Update – MSU CICS',
    html: shell(bodyContent),
    attachments: attachment,
  });
};