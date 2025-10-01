const nodemailer = require('nodemailer');

// Email configuration
const createTransporter = () => {
  // For development, you can use ethereal.email or configure with a real SMTP service
  // In production, use environment variables for real email credentials
  
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  
  // Default to console logging for development
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'test@example.com',
      pass: process.env.SMTP_PASSWORD || 'test'
    }
  });
};

const transporter = createTransporter();

// Email templates
const getRegistrationConfirmationEmail = (user, competition) => {
  return {
    subject: `Sikeres regisztráció - ${competition.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎣 Regisztráció Megerősítve!</h1>
          </div>
          <div class="content">
            <p>Kedves ${user.firstName} ${user.lastName}!</p>
            
            <p>Sikeresen regisztráltál a következő versenyre:</p>
            
            <div class="info-box">
              <h2 style="margin-top: 0;">${competition.name}</h2>
              <p><strong>Dátum:</strong> ${new Date(competition.date).toLocaleDateString('hu-HU', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              ${competition.location ? `<p><strong>Helyszín:</strong> ${competition.location}</p>` : ''}
              ${competition.entry_fee ? `<p><strong>Nevezési díj:</strong> ${competition.entry_fee}</p>` : ''}
            </div>
            
            <p>A verseny további részleteit az alábbi gombra kattintva tekintheted meg:</p>
            
            <a href="${process.env.CLIENT_URL || 'http://localhost:4200'}/competitions/${competition.id}" class="button">
              Verseny Részletei
            </a>
            
            <p><strong>Fontos információk:</strong></p>
            <ul>
              <li>Regisztrációdat emailben kaptad meg</li>
              <li>A versenyre való bejelentkezéshez hozd magaddal ezt az emailt vagy jelentkezz be a fiókodba</li>
              <li>Ha vissza szeretnél lépni a versenyről, azt bármikor megteheted a verseny oldalán</li>
            </ul>
            
            <p>Sok sikert kívánunk a versenyen!</p>
            
            <p>Üdvözlettel,<br><strong>Horgászverseny Csapata</strong></p>
            
            <div class="footer">
              <p>Ez egy automatikus email. Kérjük, ne válaszolj rá közvetlenül.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Regisztráció Megerősítve!
      
      Kedves ${user.firstName} ${user.lastName}!
      
      Sikeresen regisztráltál a következő versenyre:
      
      ${competition.name}
      Dátum: ${new Date(competition.date).toLocaleDateString('hu-HU')}
      ${competition.location ? `Helyszín: ${competition.location}` : ''}
      
      Sok sikert kívánunk a versenyen!
      
      Üdvözlettel,
      Horgászverseny Csapata
    `
  };
};

const getWithdrawalConfirmationEmail = (user, competition) => {
  return {
    subject: `Visszalépés megerősítve - ${competition.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #f5576c; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Visszalépés Visszaigazolva</h1>
          </div>
          <div class="content">
            <p>Kedves ${user.firstName} ${user.lastName}!</p>
            
            <p>Visszaléptél a következő versenyről:</p>
            
            <div class="info-box">
              <h2 style="margin-top: 0;">${competition.name}</h2>
              <p><strong>Dátum:</strong> ${new Date(competition.date).toLocaleDateString('hu-HU', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
            
            <p>Reméljük, hogy egy másik alkalommal részt tudsz venni verseenyeinken.</p>
            
            <p>Ha meggondoltad magad, újra regisztrálhatsz a versenyre, amíg van szabad hely.</p>
            
            <p>Üdvözlettel,<br><strong>Horgászverseny Csapata</strong></p>
            
            <div class="footer">
              <p>Ez egy automatikus email. Kérjük, ne válaszolj rá közvetlenül.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Visszalépés Visszaigazolva
      
      Kedves ${user.firstName} ${user.lastName}!
      
      Visszaléptél a következő versenyről:
      ${competition.name}
      Dátum: ${new Date(competition.date).toLocaleDateString('hu-HU')}
      
      Reméljük, hogy egy másik alkalommal részt tudsz venni verseenyeinken.
      
      Üdvözlettel,
      Horgászverseny Csapata
    `
  };
};

// Send email function
const sendEmail = async (to, subject, html, text) => {
  try {
    // If no real email service is configured, just log to console
    if (!process.env.EMAIL_SERVICE && !process.env.SMTP_HOST) {
      console.log('=== EMAIL SIMULATION ===');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text}`);
      console.log('========================');
      return { success: true, messageId: 'simulated-' + Date.now() };
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Horgászverseny" <noreply@horgaszverseny.hu>',
      to,
      subject,
      html,
      text
    });

    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Public API
const sendRegistrationConfirmation = async (user, competition) => {
  // TEMPORARILY DISABLED - Email sending is turned off
  console.log(`[EMAIL DISABLED] Would send registration confirmation to ${user.email} for ${competition.name}`);
  return { success: true, messageId: 'disabled-' + Date.now() };
  
  // Uncomment below to re-enable emails
  // const emailContent = getRegistrationConfirmationEmail(user, competition);
  // return await sendEmail(
  //   user.email,
  //   emailContent.subject,
  //   emailContent.html,
  //   emailContent.text
  // );
};

const sendWithdrawalConfirmation = async (user, competition) => {
  // TEMPORARILY DISABLED - Email sending is turned off
  console.log(`[EMAIL DISABLED] Would send withdrawal confirmation to ${user.email} for ${competition.name}`);
  return { success: true, messageId: 'disabled-' + Date.now() };
  
  // Uncomment below to re-enable emails
  // const emailContent = getWithdrawalConfirmationEmail(user, competition);
  // return await sendEmail(
  //   user.email,
  //   emailContent.subject,
  //   emailContent.html,
  //   emailContent.text
  // );
};

module.exports = {
  sendRegistrationConfirmation,
  sendWithdrawalConfirmation,
  sendEmail
};

