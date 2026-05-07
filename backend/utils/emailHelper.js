import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100
});

transporter.verify((error, success) => {
    if (error) {
        console.error('SMTP Connection Error:', error);
    } else {
        console.log('SMTP Server is ready to take our messages');
    }
});

const logoPath = path.join(process.cwd(), 'public', 'cics.png');

const s = {
    body: "background-color: #f8fafc; padding: 48px 20px; font-family: 'Poppins', 'Inter', Arial, sans-serif; color: #1e1b4b; line-height: 1.5;",
    header: "text-align: center; margin-bottom: 32px;",
    badge: "font-size: 11px; font-weight: 800; color: #2f318d; text-transform: uppercase; letter-spacing: 0.15em; display: block; margin-bottom: 8px; opacity: 0.8;",
    card: "background: #ffffff; border-radius: 40px; padding: 40px; border: 1px solid #e2e8f0; max-width: 520px; margin: 0 auto; box-shadow: 0 20px 40px rgba(47, 49, 141, 0.05);",
    cardDanger: "background: #ffffff; border-radius: 40px; padding: 40px; border: 1px solid #fee2e2; max-width: 520px; margin: 0 auto; box-shadow: 0 20px 40px rgba(220, 38, 38, 0.05);",
    iconBox: (bg, color) => `width: 64px; height: 64px; line-height: 64px; border-radius: 22px; background: ${bg}; color: ${color}; text-align: center; font-size: 28px; margin: 0 auto 24px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);`,
    cardTitle: "font-size: 22px; font-weight: 800; color: #1e293b; text-align: center; margin: 0 0 8px; letter-spacing: -0.02em;",
    cardSub: "font-size: 15px; color: #64748b; text-align: center; line-height: 1.6; margin: 0;",
    sectionLbl: "font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin: 32px 0 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; text-align: center;",
    voteRow: "background: #ffffff; padding: 18px 24px; border-radius: 20px; margin-bottom: 12px; border: 1px solid #f1f5f9; box-shadow: 0 2px 4px rgba(0,0,0,0.01);",
    votePos: "font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 4px; text-align: left;",
    voteName: "font-size: 16px; font-weight: 800; color: #2f318d; margin: 0; text-align: left;",
    noticeBox: "background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 24px; padding: 20px 24px; text-align: center; margin-top: 32px;",
    noticeText: "font-size: 13px; color: #64748b; line-height: 1.6; margin: 0;",
    dangerBox: "background: #fff1f2; border: 1px solid #fecaca; border-radius: 24px; padding: 24px; text-align: center; margin-top: 32px;",
    ctaBtn: "display: inline-block; background: #2f318d; color: #ffffff; padding: 18px 36px; border-radius: 20px; text-decoration: none; font-size: 15px; font-weight: 800; margin-top: 32px; box-shadow: 0 10px 20px rgba(47, 49, 141, 0.2);",
    footer: "text-align: center; margin-top: 32px; font-size: 11px; color: #94a3b8; font-weight: 600; letter-spacing: 0.02em;",
};

const logoImg = `<img src="cid:cics-logo" alt="CICS Logo" style="height: 80px; width: 80px; border-radius: 24px; margin: 0 auto 16px; display: block; box-shadow: 0 8px 16px rgba(47, 49, 141, 0.08);">`;
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
            <span style="${s.badge}">Institutional Election Portal</span>
            <h1 style="font-size: 32px; font-weight: 900; color: #1e293b; margin: 0; letter-spacing: -0.04em;">
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
        from: `"MSU CICS Elections" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: `Ballot Receipt: ${electionName}`,
        html,
        attachments: attachment,
    });
};

export const sendStatusEmail = async (userEmail, userName, action) => {
    const isApproved = action === 'approved';
    const loginUrl = 'https://cicsvotingsystem.vercel.app/login';

    const html = `
    <div style="${s.body}">
        <div style="${s.header}">
            ${logoImg}
            <span style="${s.badge}">Membership Gatekeeper</span>
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
                    <a href="${loginUrl}" style="${s.ctaBtn}">
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
        from: `"MSU CICS Membership" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: isApproved
            ? 'Application Approved – MSU CICS'
            : 'Application Status Update – MSU CICS',
        html,
        attachments: attachment,
    });
};