export const getMfaSetupTemplate = (qrCodeUrl: string, secret: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .qr-code { text-align: center; margin: 20px 0; }
    .qr-code img { max-width: 200px; }
    .secret-key { 
      background: #f5f5f5; 
      padding: 10px; 
      font-family: monospace; 
      text-align: center; 
    }
    .footer { margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Two-Factor Authentication Setup</h2>
    <p>You have enabled two-factor authentication for your account. Use your authenticator app to scan the QR code below:</p>
    <div class="qr-code">
      <img src="${qrCodeUrl}" alt="QR Code">
    </div>
    <p>If you can't scan the QR code, use this secret key in your authenticator app:</p>
    <div class="secret-key">
      ${secret}
    </div>
    <p><strong>Important:</strong> Keep this secret key safe and never share it with anyone.</p>
    <div class="footer">
      <p>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
`; 