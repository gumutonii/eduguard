const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send approval notification email
const sendApprovalNotification = async (userEmail, userName, isApproved = true) => {
  try {
    const transporter = createTransporter();
    
    const subject = isApproved 
      ? '🎉 Your EduGuard Account Has Been Approved!'
      : '❌ Your EduGuard Account Application';
    
    const htmlContent = isApproved 
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">EduGuard</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Student Dropout Prevention Platform</p>
          </div>
          
          <div style="padding: 40px 30px; background: #f8f9fa;">
            <h2 style="color: #28a745; margin-top: 0;">Great News, ${userName}!</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Your EduGuard account has been approved by an administrator. You can now access your dashboard and start using the platform.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="margin-top: 0; color: #28a745;">What's Next?</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li>Log in to your account using your credentials</li>
                <li>Complete your profile setup</li>
                <li>Explore your role-specific dashboard</li>
                <li>Start monitoring student progress and preventing dropouts</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/auth/login" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Access Your Dashboard
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p>If you have any questions, please contact our support team.</p>
            <p>© 2024 EduGuard. All rights reserved.</p>
          </div>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">EduGuard</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Student Dropout Prevention Platform</p>
          </div>
          
          <div style="padding: 40px 30px; background: #f8f9fa;">
            <h2 style="color: #dc3545; margin-top: 0;">Account Application Update</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Thank you for your interest in EduGuard, ${userName}. Unfortunately, your account application was not approved at this time.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <h3 style="margin-top: 0; color: #dc3545;">What This Means</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li>Your account will not be activated</li>
                <li>You will not be able to access the platform</li>
                <li>If you believe this is an error, please contact support</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              If you have any questions about this decision, please contact our support team for more information.
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p>© 2024 EduGuard. All rights reserved.</p>
          </div>
        </div>
      `;

    const mailOptions = {
      from: `"EduGuard" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: subject,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Approval email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending approval email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"EduGuard" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: '🔐 Reset Your EduGuard Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">EduGuard</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Password Reset Request</p>
          </div>
          
          <div style="padding: 40px 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Hello ${userName}!</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              We received a request to reset your password for your EduGuard account.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #667eea;">Reset Your Password</h3>
              <p style="color: #666; line-height: 1.8;">
                Click the button below to reset your password. This link will expire in 1 hour for security reasons.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reset My Password
              </a>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Security Note:</strong> If you didn't request this password reset, please ignore this email. 
                Your password will remain unchanged.
              </p>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p>This link expires in 1 hour for your security.</p>
            <p>© 2024 EduGuard. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendApprovalNotification,
  sendPasswordResetEmail
};
