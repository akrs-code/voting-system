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

const logoPath = path.join(process.cwd(), 'public', 'cics.png');

const s = {
    body:       "background-color: #f1f5f9; padding: 36px 20px; font-family: 'Poppins', Arial, sans-serif; color: #1e1b4b;",
    header:     "text-align: center; margin-bottom: 28px;",
    logoWrap:   "width: 64px; height: 64px; border-radius: 18px; background: #eef2ff; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;",
    badge:      "font-size: 10px; font-weight: 700; color: #2f318d; text-transform: uppercase; letter-spacing: 0.14em; display: block; margin-bottom: 6px;",
    card:       "background: #ffffff; border-radius: 28px; padding: 36px; border: 1px solid #e2e8f0; max-width: 500px; margin: 0 auto;",
    cardDanger: "background: #ffffff; border-radius: 28px; padding: 36px; border: 1px solid #fecaca; max-width: 500px; margin: 0 auto;",
    iconBox:    (bg, color) => `width: 56px; height: 56px; border-radius: 18px; background: ${bg}; color: ${color}; display: flex; align-items: center; justify-content: center; font-size: 22px; margin: 0 auto 20px;`,
    cardTitle:  "font-size: 18px; font-weight: 700; color: #1e293b; text-align: center; margin: 0 0 6px;",
    cardSub:    "font-size: 14px; color: #64748b; text-align: center; line-height: 1.6; margin: 0;",
    sectionLbl: "font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin: 28px 0 12px;",
    voteRow:    "background: #f8fafc; padding: 14px 18px; border-radius: 16px; margin-bottom: 8px; border: 1px solid #e2e8f0;",
    votePos:    "font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;",
    voteName:   "font-size: 15px; font-weight: 700; color: #2f318d; margin: 2px 0 0;",
    noticeBox:  "background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 20px; padding: 18px 22px; text-align: center; margin-top: 24px;",
    noticeText: "font-size: 12px; color: #64748b; line-height: 1.6; margin: 0;",
    dangerBox:  "background: #fff1f2; border: 1px solid #fecaca; border-radius: 20px; padding: 20px 22px; text-align: center; margin-top: 24px;",
    ctaBtn:     "display: inline-block; background: #2f318d; color: #ffffff; padding: 15px 32px; border-radius: 16px; text-decoration: none; font-size: 14px; font-weight: 700; margin-top: 24px;",
    footer:     "text-align: center; margin-top: 28px; font-size: 10px; color: #94a3b8; font-weight: 500;",
};

const logoImg = `<img src="cid:cics-logo" alt="CICS Logo" style="height: 64px; width: 64px; border-radius: 18px; margin: 0 auto 16px; display: block;">`;
const attachment = [{ filename: 'cics.png', path: logoPath, cid: 'cics-logo' }];
const footerHtml = `<p style="${s.footer}">© 2026 MSU College of Information and Computing Sciences</p>`;

export const sendVoteEmail = async (userEmail, userName, electionName, votes) => {
    const voteRows = votes.map(v => `
        <div style="${s.voteRow}">
            <p style="${s.votePos}">${v.positionName}</p>
            <p style="${s.voteName}">${v.candidateName}</p>
        </div>
    `).join('');

    const html = `
    <div style="${s.body}">
        <div style="${s.header}">
            ${logoImg}
            <span style="${s.badge}">Official MSU CICS Ballot</span>
            <h1 style="font-size: 26px; font-weight: 800; color: #1e293b; margin: 0;">
                Ballot <span style="color: #2f318d;">Receipt</span>
            </h1>
        </div>
        <div style="${s.card}">
            <div style="${s.iconBox('#dcfce7', '#16a34a')}">✓</div>
            <p style="${s.cardTitle}">Hi ${userName},</p>
            <p style="${s.cardSub}">Your ballot for <b>${electionName}</b> has been securely recorded.</p>
            <p style="${s.sectionLbl}">Your Votes</p>
            ${voteRows}
            <div style="${s.noticeBox}">
                <p style="${s.noticeText}">
                    This serves as your <b>official cryptographic receipt</b>.
                    Your vote remains anonymous and encrypted.
                </p>
            </div>
        </div>
        ${footerHtml}
    </div>`;

    return transporter.sendMail({
        from: '"MSU CICS Elections" <solaiman.ar65@s.msumain.edu.ph>',
        to: userEmail,
        subject: `Ballot Receipt: ${electionName}`,
        html,
        attachments: attachment,
    });
};

export const sendStatusEmail = async (userEmail, userName, action) => {
    const isApproved = action === 'approved';

    const html = `
    <div style="${s.body}">
        <div style="${s.header}">
            ${logoImg}
            <span style="${s.badge}">Membership Department</span>
        </div>
        <div style="${isApproved ? s.card : s.cardDanger}">
            <div style="${s.iconBox(
                isApproved ? '#eef2ff' : '#fee2e2',
                isApproved ? '#2f318d' : '#dc2626'
            )}">${isApproved ? '👤' : '✕'}</div>
            <p style="${s.cardTitle}">Hi ${userName},</p>
            <p style="${s.cardSub}">
                ${isApproved
                    ? 'Great news! Your registration for the <b>MSU CICS Election Portal</b> has been approved. You are now authorized to vote.'
                    : 'Your registration was <b>not approved</b>. To maintain system integrity, your application data has been removed.'}
            </p>
            ${isApproved ? `
                <div style="text-align: center;">
                    <a href="https://cicsvotingsystem.vercel.app/login" style="${s.ctaBtn}">
                        Access voter dashboard
                    </a>
                </div>
            ` : `
                <div style="${s.dangerBox}">
                    <p style="font-size: 13px; font-weight: 700; color: #991b1b; margin: 0 0 8px;">Verification failed</p>
                    <p style="font-size: 12px; color: #b91c1c; line-height: 1.6; margin: 0;">
                        Please ensure your <b>Student ID</b> and <b>Department</b> perfectly match
                        your institutional records before trying again.
                    </p>
                </div>
            `}
        </div>
        ${footerHtml}
    </div>`;

    return transporter.sendMail({
        from: '"MSU CICS Membership" <solaiman.ar65@s.msumain.edu.ph>',
        to: userEmail,
        subject: isApproved
            ? 'Application Approved – MSU CICS'
            : 'Application Status Update – MSU CICS',
        html,
        attachments: attachment,
    });
};