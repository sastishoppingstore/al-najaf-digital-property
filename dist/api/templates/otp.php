<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:linear-gradient(135deg,#fef3c7,#fde68a,#fbbf24);font-family:'Segoe UI',Tahoma,sans-serif;min-height:100vh">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px"><tr><td align="center">
<table style="max-width:480px;width:100%" cellpadding="0" cellspacing="0">
<tr><td style="background:#ffffff;border-radius:24px;padding:48px 32px;box-shadow:0 20px 60px rgba(0,0,0,0.15),0 0 40px rgba(251,191,36,0.2);transform:perspective(1000px) rotateX(2deg);text-align:center">
<div style="width:80px;height:80px;margin:0 auto 24px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(245,158,11,0.4)">
<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
</div>
<h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#1e293b;letter-spacing:-0.5px">Verify Your Account</h1>
<p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6">Hello <strong style="color:#1e293b"><?=htmlspecialchars($name)?></strong>,<br>Use this code to complete your login</p>
<div style="background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-radius:16px;padding:24px;margin-bottom:28px;border:2px dashed #f59e0b">
<span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#d97706;font-family:'Courier New',monospace"><?=htmlspecialchars($otp)?></span>
</div>
<p style="margin:0;font-size:13px;color:#94a3b8">This code expires in 10 minutes. Never share this code.</p>
<hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0">
<p style="margin:0;font-size:12px;color:#94a3b8"><?=htmlspecialchars(SMTP_FROM_NAME)?> &bull; <a href="<?=htmlspecialchars($site_url)?>" style="color:#d97706;text-decoration:none"><?=htmlspecialchars($site_url)?></a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>
