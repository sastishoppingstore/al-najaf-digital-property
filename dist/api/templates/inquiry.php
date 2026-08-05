<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:linear-gradient(135deg,#fef3c7,#fde68a,#fbbf24);font-family:'Segoe UI',Tahoma,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px"><tr><td align="center">
<table style="max-width:520px;width:100%" cellpadding="0" cellspacing="0">
<tr><td style="background:#ffffff;border-radius:24px;padding:40px 32px;box-shadow:0 20px 60px rgba(0,0,0,0.15),0 0 40px rgba(251,191,36,0.2)">
<div style="width:72px;height:72px;margin:0 auto 20px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(245,158,11,0.4)">
<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
</div>
<h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1e293b;text-align:center">New Inquiry Received!</h1>
<p style="margin:0 0 24px;font-size:14px;color:#64748b;text-align:center">Dear <strong style="color:#1e293b"><?=htmlspecialchars($name)?></strong>, someone is interested in your property</p>

<div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border-radius:16px;padding:20px;margin-bottom:20px;border:1px solid #fde68a">
<h3 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#92400e"><?=htmlspecialchars($propertyTitle)?></h3>
<table width="100%" cellpadding="6" cellspacing="0">
<tr><td style="font-size:13px;color:#64748b">Name</td><td style="font-size:14px;font-weight:600;color:#1e293b;text-align:right"><?=htmlspecialchars($buyerName)?></td></tr>
<tr><td style="font-size:13px;color:#64748b">Phone</td><td style="font-size:14px;font-weight:600;color:#1e293b;text-align:right"><?=htmlspecialchars($buyerPhone)?></td></tr>
<?php if ($buyerEmail): ?>
<tr><td style="font-size:13px;color:#64748b">Email</td><td style="font-size:14px;font-weight:600;color:#1e293b;text-align:right"><?=htmlspecialchars($buyerEmail)?></td></tr>
<?php endif; ?>
</table>
<?php if ($message): ?>
<div style="margin-top:12px;padding:12px;background:#f8fafc;border-radius:8px;font-size:13px;color:#475569;line-height:1.5"><?=nl2br(htmlspecialchars($message))?></div>
<?php endif; ?>
</div>

<a href="tel:<?=htmlspecialchars($buyerPhone)?>" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;border-radius:12px;text-decoration:none;font-size:15px;font-weight:600;margin-right:8px;margin-bottom:8px;box-shadow:0 4px 12px rgba(16,185,129,0.4)">Call Now</a>
<a href="https://wa.me/<?=preg_replace('/[^0-9]/', '', $buyerPhone)?>" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#25d366,#128C7E);color:#ffffff;border-radius:12px;text-decoration:none;font-size:15px;font-weight:600;box-shadow:0 4px 12px rgba(37,211,102,0.4)">WhatsApp</a>

<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
<p style="margin:0;font-size:12px;color:#94a3b8;text-align:center"><?=htmlspecialchars(SMTP_FROM_NAME)?> &bull; <a href="<?=htmlspecialchars($site_url)?>" style="color:#d97706;text-decoration:none"><?=htmlspecialchars($site_url)?></a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>
