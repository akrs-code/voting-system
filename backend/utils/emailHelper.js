import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'solaiman.ar65@s.msumain.edu.ph',
    pass: 'kdoc avau pkba ouus',
  },
});

export const sendVoteEmail = async (userEmail, userName, electionName, votes) => {
  const voteRows = votes.map(v => `
    <div style="background-color: #ffffff; padding: 15px; border-radius: 20px; margin-bottom: 10px; border: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">${v.positionName}</p>
      <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color: #2f318d;">${v.candidateName}</p>
    </div>
  `).join('');

  const htmlContent = `
    <div style="background-color: #f8fafc; padding: 40px 20px; font-family: sans-serif; color: #1e1b4b;">
      <div style="max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <p style="font-size: 11px; font-weight: 700; color: #2f318d; text-transform: uppercase; letter-spacing: 2px; opacity: 0.6;">Official MSU CICS Ballot</p>
          <h1 style="font-size: 30px; font-weight: 900; margin: 10px 0;">VOTE <span style="color: #2f318d;">CONFIRMED!</span></h1>
        </div>
        <div style="background-color: #ffffff; border-radius: 35px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #dcfce7; color: #16a34a; width: 60px; height: 60px; line-height: 60px; border-radius: 20px; margin: 0 auto 20px auto; font-size: 30px;">✓</div>
            <h2 style="font-size: 22px; font-weight: 700;">Hi ${userName},</h2>
            <p style="color: #64748b; font-size: 15px;">Your ballot for <b>${electionName}</b> has been recorded.</p>
          </div>
          <div style="margin: 30px 0;">
            <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; color: #1e1b4b;">Summary:</h3>
            ${voteRows}
          </div>
        </div>
        <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 30px;">© 2026 MSU College of Information and Computing Sciences</p>
      </div>
    </div>`;

  return transporter.sendMail({
    from: '"MSU CICS Elections" <solaiman.ar65@s.msumain.edu.ph>',
    to: userEmail,
    subject: `Ballot Receipt: ${electionName}`,
    html: htmlContent,
  });
};