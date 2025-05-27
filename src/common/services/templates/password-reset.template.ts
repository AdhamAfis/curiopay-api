export const getPasswordResetTemplate = (resetLink: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { 
      display: inline-block; 
      padding: 10px 20px; 
      background-color: #4CAF50; 
      color: white; 
      text-decoration: none; 
      border-radius: 5px; 
    }
    .footer { margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Password Reset Request</h2>
    <p>You have requested to reset your password. Click the button below to set a new password:</p>
    <p><a href="${resetLink}" class="button">Reset Password</a></p>
    <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
    <p>This link will expire in 1 hour.</p>
    <div class="footer">
      <p>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;
