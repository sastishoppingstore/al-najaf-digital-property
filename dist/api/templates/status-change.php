<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:linear-gradient(135deg,#fef3c7,#fde68a,#fbbf24);font-family:'Segoe UI',Tahoma,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px"><tr><td align="center">
<table style="max-width:520px;width:100%" cellpadding="0" cellspacing="0">
<tr><td style="background:#ffffff;border-radius:24px;padding:40px 32px;box-shadow:0 20px 60px rgba(0,0,0,0.15),0 0 40px rgba(251,191,36,0.2)">
<div style="width:72px;height:72px;margin:0 auto 20px;background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(59,130,246,0.4)">
<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
</div>
<h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1e293b;text-align:center">Order Status Updated</h1>
<p style="margin:0 0 24px;font-size:14px;color:#64748b;text-align:center">Dear <strong style="color:#1e293b"><?=htmlspecialchars($name)?></strong>, your order status has changed</p>

<div style="background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-radius:16px;padding:20px;margin-bottom:20px">
<table width="100%" cellpadding="6" cellspacing="0">
<tr><td style="font-size:13px;color:#64748b">Order Reference</td><td style="font-size:14px;font-weight:600;color:#1e293b;text-align:right"><?=htmlspecialchars($orderRef)?></td></tr>
<tr><td style="font-size:13px;color:#64748b">Service Type</td><td style="font-size:14px;font-weight:600;color:#1e293b;text-align:right"><?=htmlspecialchars($orderType)?></td></tr>
<tr><td style="font-size:13px;color:#64748b">Previous Status</td><td style="font-size:14px;font-weight:600;color:#dc2626;text-align:right"><?=htmlspecialchars($oldStatus)?></td></tr>
<tr><td style="font-size:13px;color:#64748b">New Status</td><td style="font-size:14px;font-weight:700;color:#10b981;text-align:right"><?=htmlspecialchars($newStatus)?></td></tr>
</table>
</div>

<?php if ($note): ?>
<div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border-radius:12px;padding:16px;margin-bottom:24px;border-left:4px solid #f59e0b">
<p style="margin:0;font-size:13px;color:#92400e;line-height:1.5"><strong>Note:</strong> <?=nl2br(htmlspecialchars($note))?></p>
</div>
<?php endif; ?>

<a href="<?=htmlspecialchars($site_url)?>/dashboard" style="display:block;text-align:center;padding:14px 24px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff;border-radius:12px;text-decoration:none;font-size:15px;font-weight:600;box-shadow:0 4px 12px rgba(59,130,246,0.4)">View in Dashboard</a>

<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
<p style="margin:0;font-size:12px;color:#94a3b8;text-align:center"><?=htmlspecialchars(SMTP_FROM_NAME)?> &bull; <a href="<?=htmlspecialchars($site_url)?>" style="color:#d97706;text-decoration:none"><?=htmlspecialchars($site_url)?></a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>
