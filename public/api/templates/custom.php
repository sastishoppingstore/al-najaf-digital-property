<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body{font-family:sans-serif;background:#f8fafc;margin:0;padding:0}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:#1a3d6e;padding:20px;text-align:center;border-radius:12px 12px 0 0}
.header h1{color:#ffffff;margin:0;font-size:18px}
.body{background:#ffffff;padding:30px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:0}
.footer{text-align:center;padding:20px;color:#94a3b8;font-size:12px}
</style></head><body>
<div class="container">
<div class="header"><h1><?=htmlspecialchars($subject ?? 'Custom Email')?></h1></div>
<div class="body">
<?=nl2br(htmlspecialchars($message ?? ''))?>
</div>
<div class="footer">Al Najaf Digital Property</div>
</div>
</body></html>
