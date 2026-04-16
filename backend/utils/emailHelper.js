import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, 
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const styles = {
    body: "background-color: #f8fafc; padding: 40px 20px; font-family: 'Poppins', sans-serif, Arial; color: #1e1b4b;",
    card: "background-color: #ffffff; border-radius: 40px; padding: 45px; box-shadow: 0 10px 30px rgba(79, 70, 229, 0.1); border: 1px solid #e2e8f0; max-width: 500px; margin: 0 auto;",
    button: "display: inline-block; background-color: #2f318d; color: #ffffff; padding: 18px 36px; border-radius: 20px; text-decoration: none; font-weight: 700; font-size: 15px; margin-top: 20px; box-shadow: 0 10px 15px rgba(47, 49, 141, 0.2);",
    badge: "font-size: 11px; font-weight: 800; color: #2f318d; text-transform: uppercase; letter-spacing: 0.15em; opacity: 0.8; margin-bottom: 8px; display: block;",
    iconBox: "width: 64px; height: 64px; line-height: 64px; border-radius: 24px; margin: 0 auto 24px auto; font-size: 30px; text-align: center;"
};

const logoPath = path.join(process.cwd(), 'public', 'cics.png');

export const sendVoteEmail = async (userEmail, userName, electionName, votes) => {
  const voteRows = votes.map(v => `
    <div style="background-color: #ffffff; padding: 18px; border-radius: 24px; margin-bottom: 12px; border: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">${v.positionName}</p>
      <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 700; color: #2f318d;">${v.candidateName}</p>
    </div>
  `).join('');

  const htmlContent = `
    <div style="${styles.body}">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="cid:cics-logo" alt="CICS Logo" style="height: 80px; width: 80px; margin-bottom: 20px;">
        <span style="${styles.badge}">Official MSU CICS Ballot</span>
        <h1 style="font-size: 32px; font-weight: 800; color: #1e293b; margin: 0;">BALLOT <span style="color: #2f318d;">RECEIPT</span></h1>
      </div>
      <div style="${styles.card}">
        <div style="text-align: center;">
          <div style="${styles.iconBox} background-color: #dcfce7; color: #16a34a;">✓</div>
          <h2 style="font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 8px;">Hi ${userName},</h2>
          <p style="color: #64748b; font-size: 16px; margin-top: 0;">Your ballot for <b>${electionName}</b> has been securely recorded.</p>
        </div>
        <div style="margin: 35px 0;">
          <h3 style="font-size: 13px; font-weight: 600; margin-bottom: 15px; color: #475569; letter-spacing: 0.05em;">Transaction Summary</h3>
          ${voteRows}
        </div>
        <div style="background-color: #f1f5f9; padding: 22px; border-radius: 24px; text-align: center; border: 1px dashed #cbd5e1;">
          <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.6; font-weight: 500;">
            This serves as your <b>official cryptographic receipt</b>. Your vote remains anonymous and encrypted.
          </p>
        </div>
      </div>
      <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 40px; font-weight: 500;">© 2026 MSU College of Information and Computing Sciences</p>
    </div>`;

  return transporter.sendMail({
    from: '"MSU CICS Elections" <solaiman.ar65@s.msumain.edu.ph>',
    to: userEmail,
    subject: `Ballot Receipt: ${electionName}`,
    html: htmlContent,
    attachments: [{
        filename: 'cics.png',
        path: logoPath,
        cid: 'cics-logo'
    }]
  });
};

export const sendStatusEmail = async (userEmail, userName, action) => {
  const isApproved = action === 'approved';
  
  const htmlContent = `
    <div style="${styles.body}">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="cid:cics-logo" alt="CICS Logo" style="height: 80px; width: 80px; margin-bottom: 20px;">
        <span style="${styles.badge}">Membership Department</span>
      </div>
      <div style="${styles.card} border: 1px solid ${isApproved ? '#e2e8f0' : '#fee2e2'};">
        <div style="text-align: center;">
          <div style="${styles.iconBox} background-color: ${isApproved ? '#eef2ff' : '#fef2f2'}; color: ${isApproved ? '#2f318d' : '#ef4444'};">
            ${isApproved ? '👤' : '✕'}
          </div>
          <h2 style="font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 10px;">Hi ${userName},</h2>
          <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
            ${isApproved 
              ? 'Great news! Your registration for the <b>MSU CICS Election Portal</b> has been approved. You are now authorized to vote.' 
              : 'Your registration was <b>not approved</b>. To maintain system integrity, your application data has been removed.'}
          </p>
        </div>
        
        ${!isApproved ? `
        <div style="background-color: #fef2f2; padding: 25px; border-radius: 24px; border: 1px solid #fee2e2; margin-top: 25px;">
          <p style="margin: 0; font-size: 14px; color: #991b1b; font-weight: 700; text-align: center;">
            Verification Failed
          </p>
          <p style="margin: 10px 0 0 0; font-size: 13px; color: #b91c1c; text-align: center; opacity: 0.8; line-height: 1.5;">
            Please ensure your <b>Student ID</b> and <b>Department</b> perfectly match your institutional records before trying again.
          </p>
        </div>
        ` : `
        <div style="text-align: center; margin-top: 10px;">
          <a href="https://cicsvotingsystem.vercel.app/login" style="${styles.button}">Access Voter Dashboard</a>
        </div>
        `}
      </div>
      <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 40px; font-weight: 500;">© 2026 MSU College of Information and Computing Sciences</p>
    </div>`;

  return transporter.sendMail({
    from: '"MSU CICS Membership" <solaiman.ar65@s.msumain.edu.ph>',
    to: userEmail,
    subject: isApproved ? 'Application Approved - MSU CICS' : 'Application Status Update - MSU CICS',
    html: htmlContent,
    attachments: [{
        filename: 'cics.png',
        path: logoPath,
        cid: 'cics-logo'
    }]
  });
};