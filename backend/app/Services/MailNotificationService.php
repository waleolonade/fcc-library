<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Mailer\Transport;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\Address;

class MailNotificationService
{
    /**
     * Get effective mail settings from library_settings table or .env
     */
    public static function getMailConfig(): array
    {
        $dbHost = DB::table('library_settings')->where('setting_key', 'mail_smtp_host')->value('setting_value');
        $dbPort = DB::table('library_settings')->where('setting_key', 'mail_smtp_port')->value('setting_value');
        $dbUser = DB::table('library_settings')->where('setting_key', 'mail_smtp_username')->value('setting_value');
        $dbPass = DB::table('library_settings')->where('setting_key', 'mail_smtp_password')->value('setting_value');
        $dbEnc  = DB::table('library_settings')->where('setting_key', 'mail_smtp_encryption')->value('setting_value');
        $dbFrom = DB::table('library_settings')->where('setting_key', 'mail_from_address')->value('setting_value');

        return [
            'mailer'        => env('MAIL_MAILER', 'smtp'),
            'host'          => $dbHost ?: env('MAIL_HOST', 'mail.fccibadanlibrary.com.ng'),
            'port'          => (int)($dbPort ?: env('MAIL_PORT', 465)),
            'username'      => $dbUser ?: env('MAIL_USERNAME', 'librarian@fccibadanlibrary.com.ng'),
            'password'      => $dbPass ?: env('MAIL_PASSWORD', ''),
            'encryption'    => $dbEnc ?: env('MAIL_ENCRYPTION', 'ssl'),
            'from_email'    => $dbFrom ?: env('MAIL_FROM_ADDRESS', 'noreply@fccibadanlibrary.com.ng'),
            'from_name'     => 'FCC Smart Library (Do Not Reply)',
            'noreply_email' => 'noreply@fccibadanlibrary.com.ng',
            'noreply_name'  => 'FCC Smart Library (Do Not Reply)'
        ];
    }

    /**
     * Send 2FA Login Security Verification OTP
     */
    public static function sendLoginOtpEmail(string $recipientEmail, string $recipientName, string $otpCode, string $role = 'Authorized Staff'): array
    {
        $subject = "FCC Library - Two-Factor Login Verification Code: {$otpCode}";
        $html = self::buildOtpEmailTemplate([
            'title'        => 'Two-Factor Login Verification',
            'badge'        => strtoupper($role) . ' SECURITY GATE',
            'badge_color'  => '#4f46e5',
            'name'         => $recipientName,
            'otp'          => $otpCode,
            'reason'       => "A sign-in attempt was initiated for your {$role} account on the Federal Cooperative College Library management system.",
            'expiry_mins'  => 10,
            'security_tip' => 'Never share this 6-digit cryptographic verification code with anyone. Library administrators will never ask for your code.'
        ]);

        return self::dispatchMail($recipientEmail, $recipientName, $subject, $html);
    }

    /**
     * Send Password / PIN Reset OTP
     */
    public static function sendPasswordResetOtpEmail(string $recipientEmail, string $recipientName, string $otpCode): array
    {
        $subject = "FCC Library - Password / PIN Reset Verification Code: {$otpCode}";
        $html = self::buildOtpEmailTemplate([
            'title'        => 'Password / PIN Reset Request',
            'badge'        => 'ACCOUNT SECURITY RECOVERY',
            'badge_color'  => '#059669',
            'name'         => $recipientName,
            'otp'          => $otpCode,
            'reason'       => "We received an authorized request to reset the access PIN / password for your institutional library membership account.",
            'expiry_mins'  => 15,
            'security_tip' => 'If you did not initiate this request, your account may be at risk. Contact the Central Library IT Desk immediately.'
        ]);

        return self::dispatchMail($recipientEmail, $recipientName, $subject, $html);
    }

    /**
     * Send General Library Patron Notification
     */
    public static function sendPatronNotificationEmail(string $recipientEmail, string $recipientName, string $title, string $message, string $type = 'general', ?string $actionUrl = null): array
    {
        $subject = "FCC Library Notification: {$title}";
        $html = self::buildNotificationEmailTemplate([
            'title'       => $title,
            'type'        => strtoupper($type),
            'name'        => $recipientName,
            'message'     => $message,
            'action_url'  => $actionUrl ?: 'https://fccibadanlibrary.com.ng/#/student/notifications',
            'action_text' => 'View in Library Portal'
        ]);

        return self::dispatchMail($recipientEmail, $recipientName, $subject, $html);
    }

    /**
     * Record a user-specific notification in SQLite + MySQL and dispatch a Login Security Alert Email
     */
    public static function recordAndDispatchLoginNotification(array $user, string $role = 'student', string $ipAddress = '127.0.0.1', string $userAgent = 'Web Browser', string $platform = 'Portal Login'): array
    {
        $userName = $user['name'] ?? $user['displayName'] ?? 'Authorized User';
        $userEmail = trim((string)($user['email'] ?? ''));
        $userMatric = trim((string)($user['matric'] ?? $user['username'] ?? $user['department_code'] ?? $user['id'] ?? ''));
        $deptName = $user['department_name'] ?? $user['department'] ?? $user['dept'] ?? 'FCC Ibadan';

        $roleLabel = match (strtolower($role)) {
            'admin', 'super_admin', 'chief_librarian' => 'Chief Librarian / Administrator',
            'hod' => "Head of Department ({$deptName})",
            'developer' => 'Lead Systems Developer',
            default => "Scholar / Student ({$deptName})"
        };

        $actionUrl = match (strtolower($role)) {
            'admin', 'super_admin', 'chief_librarian' => '#/admin/settings',
            'hod' => '#/hod/settings',
            'developer' => '#/developer',
            default => '#/scholar/profile'
        };

        $timestampFormatted = now('Africa/Lagos')->format('D, M j, Y \a\t g:i A') . ' (WAT)';
        $nowIso = now('Africa/Lagos')->toIso8601String();
        $notifId = 'NOTIF-LGN-' . strtoupper(\Illuminate\Support\Str::random(8));

        // Parse concise browser/OS summary from user-agent
        $deviceSummary = 'Desktop Workstation';
        if (stripos($userAgent, 'Mobile') !== false || stripos($userAgent, 'Android') !== false || stripos($userAgent, 'iPhone') !== false) {
            $deviceSummary = 'Mobile Device';
        }
        if (stripos($userAgent, 'Edg') !== false) {
            $deviceSummary .= ' (Microsoft Edge)';
        } elseif (stripos($userAgent, 'Chrome') !== false) {
            $deviceSummary .= ' (Google Chrome)';
        } elseif (stripos($userAgent, 'Firefox') !== false) {
            $deviceSummary .= ' (Mozilla Firefox)';
        } elseif (stripos($userAgent, 'Safari') !== false) {
            $deviceSummary .= ' (Apple Safari)';
        }

        $targetIdentifier = $userMatric ?: ($userEmail ?: $role);
        $notifTitle = "Security Alert: New Sign-In to Your {$roleLabel} Account";
        $notifMessage = "Hello {$userName}, your FCC Smart Library account ({$targetIdentifier}) was signed into on {$timestampFormatted} via {$platform} from {$deviceSummary} (IP: {$ipAddress}). An email notification has been dispatched to " . ($userEmail ?: 'your registered institutional address') . ".";

        // 1. Save to SQLite notifications table
        try {
            DB::table('notifications')->insert([
                'id' => $notifId,
                'matric' => $targetIdentifier,
                'type' => 'login_security',
                'title' => $notifTitle,
                'message' => $notifMessage,
                'date' => $nowIso,
                'read' => 0,
                'action_url' => $actionUrl
            ]);
        } catch (\Throwable $e) {}

        // 2. Save to MySQL notifications table
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $stmt = $pdo->prepare("
                    INSERT INTO notifications (id, matric, type, title, message, date, `read`, action_url)
                    VALUES (:id, :matric, :type, :title, :message, :date, 0, :action_url)
                ");
                $stmt->execute([
                    ':id' => $notifId,
                    ':matric' => $targetIdentifier,
                    ':type' => 'login_security',
                    ':title' => $notifTitle,
                    ':message' => $notifMessage,
                    ':date' => $nowIso,
                    ':action_url' => $actionUrl
                ]);
            }
        } catch (\Throwable $e) {}

        // 3. Also store secondary alias notification if user has both matric and email so lookup by either matches
        if (!empty($userEmail) && !empty($userMatric) && strtolower($userEmail) !== strtolower($userMatric)) {
            $aliasId = 'NOTIF-EML-' . strtoupper(\Illuminate\Support\Str::random(8));
            try {
                DB::table('notifications')->insert([
                    'id' => $aliasId,
                    'matric' => $userEmail,
                    'type' => 'login_security',
                    'title' => $notifTitle,
                    'message' => $notifMessage,
                    'date' => $nowIso,
                    'read' => 0,
                    'action_url' => $actionUrl
                ]);
            } catch (\Throwable $e) {}
        }

        // 4. Send Login Notification Email if user has a valid email
        $emailResult = ['sent' => false, 'skipped' => true];
        if (!empty($userEmail) && filter_var($userEmail, FILTER_VALIDATE_EMAIL)) {
            $emailSubject = "FCC Library Security Alert: New Sign-In ({$roleLabel})";
            $emailBody = "We detected a new sign-in to your Federal Co-operative College Smart Library account.\n\n"
                . "• Account Holder: {$userName}\n"
                . "• Account ID / Matric: {$targetIdentifier}\n"
                . "• Role / Portal: {$roleLabel}\n"
                . "• Authentication Method: {$platform}\n"
                . "• Device / Browser: {$deviceSummary}\n"
                . "• IP Address: {$ipAddress}\n"
                . "• Time (WAT): {$timestampFormatted}\n\n"
                . "If this was you, no further action is needed. If you did not authorize this sign-in, please reset your PIN/password immediately from the login screen.";

            $html = self::buildNotificationEmailTemplate([
                'title'       => 'New Account Sign-In Detected',
                'type'        => 'LOGIN SECURITY',
                'name'        => $userName,
                'message'     => $emailBody,
                'action_url'  => 'https://fccibadanlibrary.com.ng/' . $actionUrl,
                'action_text' => 'Open Your Dashboard'
            ]);

            $emailResult = self::dispatchMail($userEmail, $userName, $emailSubject, $html);
        }

        return [
            'notification_id' => $notifId,
            'notification' => [
                'id' => $notifId,
                'matric' => $targetIdentifier,
                'type' => 'login_security',
                'title' => $notifTitle,
                'message' => $notifMessage,
                'date' => $nowIso,
                'read' => 0,
                'action_url' => $actionUrl,
                'email_dispatched' => (bool)($emailResult['sent'] ?? false),
                'recipient_email' => $userEmail
            ],
            'email_result' => $emailResult
        ];
    }

    /**
     * Locate the official school logo on local disk
     */
    public static function getSchoolLogoPath(): ?string
    {
        $candidates = [
            public_path('fcc-logo.png'),
            base_path('../public/fcc-logo.png'),
            base_path('public/fcc-logo.png'),
            'C:/xampp/htdocs/fcclibrary/public/fcc-logo.png',
            'C:/xampp/htdocs/fcclibrary/backend/public/fcc-logo.png',
        ];

        foreach ($candidates as $p) {
            if (file_exists($p)) {
                return $p;
            }
        }

        return null;
    }

    /**
     * Dispatch email via configured SMTP or Laravel Mail facade with Strict No-Reply configuration
     */
    public static function dispatchMail(string $toEmail, string $toName, string $subject, string $htmlBody): array
    {
        $config = self::getMailConfig();

        // If toEmail is not a valid email, check if it's a test or placeholder
        if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
            Log::warning("[MailNotificationService] Skipped dispatch to invalid email: {$toEmail}");
            return [
                'sent'    => false,
                'error'   => "Recipient address '{$toEmail}' is not a valid email format.",
                'skipped' => true
            ];
        }

        $logoPath = self::getSchoolLogoPath();
        $fromEmail = $config['from_email'];
        $fromName = 'FCC Smart Library (Do Not Reply)';
        $noreplyEmail = $config['noreply_email'];

        try {
            // If password is provided, configure SMTP dynamically to ensure fresh credentials
            if (!empty($config['password']) && !empty($config['host'])) {
                $scheme = ($config['encryption'] === 'ssl' || (int)$config['port'] === 465) ? 'smtps' : 'smtp';
                $userEncoded = urlencode($config['username']);
                $passEncoded = urlencode($config['password']);
                $host = $config['host'];
                $port = $config['port'];
                
                $dsn = "{$scheme}://{$userEncoded}:{$passEncoded}@{$host}:{$port}?verify_peer=0&timeout=2";

                $transport = Transport::fromDsn($dsn);
                $mailer = new Mailer($transport);

                $email = (new Email())
                    ->from(new Address($fromEmail, $fromName))
                    ->replyTo(new Address($noreplyEmail, 'FCC Library (Do Not Reply)'))
                    ->to(new Address($toEmail, $toName))
                    ->subject($subject)
                    ->html($htmlBody);

                // Anti-Reply Headers (RFC 3834 auto-generated suppression)
                $email->getHeaders()
                    ->addTextHeader('Auto-Submitted', 'auto-generated')
                    ->addTextHeader('X-Auto-Response-Suppress', 'All')
                    ->addTextHeader('Precedence', 'bulk')
                    ->addTextHeader('X-Mailer', 'FCC Smart Library Notification Engine');

                // Attach / Embed the official school logo as CID
                if ($logoPath && file_exists($logoPath)) {
                    $email->embedFromPath($logoPath, 'school_logo', 'image/png');
                }

                $mailer->send($email);

                Log::info("[MailNotificationService] Successfully sent email to {$toEmail} with subject: {$subject}");
                return [
                    'sent'      => true,
                    'recipient' => $toEmail,
                    'method'    => 'smtp_direct',
                    'message'   => "Email successfully dispatched to {$toEmail}"
                ];
            }

            // Fallback to default Laravel Mailer (e.g. log, smtp, or sendmail)
            Mail::html($htmlBody, function ($msg) use ($toEmail, $toName, $subject, $fromEmail, $fromName, $noreplyEmail, $logoPath) {
                $msg->to($toEmail, $toName)
                    ->from($fromEmail, $fromName)
                    ->replyTo($noreplyEmail, 'FCC Library (Do Not Reply)')
                    ->subject($subject);

                // Anti-Reply Headers
                $msg->getHeaders()
                    ->addTextHeader('Auto-Submitted', 'auto-generated')
                    ->addTextHeader('X-Auto-Response-Suppress', 'All')
                    ->addTextHeader('Precedence', 'bulk')
                    ->addTextHeader('X-Mailer', 'FCC Smart Library Notification Engine');

                if ($logoPath && file_exists($logoPath)) {
                    $msg->embed($logoPath, 'school_logo');
                }
            });

            Log::info("[MailNotificationService] Dispatched via default Laravel mailer to {$toEmail}");
            return [
                'sent'      => true,
                'recipient' => $toEmail,
                'method'    => 'laravel_mailer',
                'message'   => "Email processed for {$toEmail}"
            ];
        } catch (\Throwable $e) {
            Log::error("[MailNotificationService] Delivery error to {$toEmail}: " . $e->getMessage());
            return [
                'sent'      => false,
                'error'     => $e->getMessage(),
                'recipient' => $toEmail
            ];
        }
    }

    /**
     * Test SMTP Connection
     */
    public static function testSmtpConnection(?string $targetEmail = null): array
    {
        $config = self::getMailConfig();
        $target = $targetEmail ?: $config['from_email'];

        $testHtml = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 16px;'>
            <table role='presentation' width='100%' style='margin-bottom: 20px;'>
                <tr>
                    <td width='64' valign='middle'>
                        <img src='cid:school_logo' alt='FCC Logo' width='56' height='56' style='display:block; border-radius:10px; background:#fff; padding:4px;' />
                    </td>
                    <td valign='middle' style='padding-left: 14px;'>
                        <h2 style='color: #38bdf8; margin: 0;'>FCC Library SMTP Test Successful</h2>
                        <p style='color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;'>Institutional Mail Gateway Online</p>
                    </td>
                </tr>
            </table>
            <p>This is a live diagnostic verification email dispatched from the <strong>Federal Cooperative College Library</strong> institutional server mail system.</p>
            <div style='background: #1e293b; padding: 16px; border-radius: 8px; border: 1px solid #334155; font-family: monospace; font-size: 13px;'>
                <div><strong>Host:</strong> {$config['host']}</div>
                <div><strong>Port:</strong> {$config['port']}</div>
                <div><strong>User:</strong> {$config['username']}</div>
                <div><strong>Encryption:</strong> {$config['encryption']}</div>
                <div><strong>Timestamp:</strong> " . date('Y-m-d H:i:s') . "</div>
            </div>
            <p style='color: #94a3b8; font-size: 12px; margin-top: 20px;'>Federal Cooperative College, Eleyele, Ibadan, Oyo State, Nigeria.</p>
        </div>";

        $res = self::dispatchMail($target, 'Library Administrator', 'FCC Library - Live SMTP Mail Verification Test', $testHtml);
        $res['config_used'] = [
            'host'       => $config['host'],
            'port'       => $config['port'],
            'username'   => $config['username'],
            'encryption' => $config['encryption'],
            'from_email' => $config['from_email'],
            'has_password' => !empty($config['password'])
        ];
        return $res;
    }

    /**
     * High-Impact Responsive HTML OTP Email Template with School Logo & Click-to-Copy
     */
    private static function buildOtpEmailTemplate(array $params): string
    {
        $year = date('Y');
        return "
<!DOCTYPE html>
<html lang='en'>
<head>
<meta charset='UTF-8'>
<meta name='viewport' content='width=device-width, initial-scale=1.0'>
<title>{$params['title']}</title>
</head>
<body style='margin:0; padding:0; background-color:#070d17; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>
  <table role='presentation' width='100%' cellspacing='0' cellpadding='0' border='0' style='background-color:#070d17; padding: 30px 15px;'>
    <tr>
      <td align='center'>
        <table role='presentation' width='100%' style='max-width: 580px; background-color:#0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow:hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);'>
          
          <!-- Institutional Header with School Logo -->
          <tr>
            <td style='background: linear-gradient(135deg, #051326 0%, #0a2540 100%); padding: 26px 28px; border-bottom: 3px solid #10b981;'>
              <table role='presentation' width='100%' cellspacing='0' cellpadding='0' border='0'>
                <tr>
                  <td width='72' valign='middle' style='padding-right: 18px;'>
                    <img src='cid:school_logo' alt='Federal Cooperative College Logo' width='64' height='64' style='display: block; border-radius: 12px; background-color: #ffffff; padding: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid #38bdf8;' />
                  </td>
                  <td valign='middle'>
                    <div style='display: inline-block; background-color: #10b981; color: #022c22; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px;'>
                      {$params['badge']}
                    </div>
                    <h1 style='margin: 0; color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: -0.3px; line-height: 1.2;'>
                      Federal Cooperative College, Ibadan
                    </h1>
                    <p style='margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; font-weight: 500;'>
                      Smart Library Management System &bull; Official Security Dispatch
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style='padding: 32px 30px;'>
              <h2 style='margin: 0 0 12px 0; color: #f1f5f9; font-size: 18px; font-weight: 700;'>
                Hello {$params['name']},
              </h2>
              <p style='margin: 0 0 24px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;'>
                {$params['reason']}
              </p>

              <!-- OTP Display Box with Click to Copy under the code -->
              <div style='background-color: #030a16; border: 2px dashed #10b981; border-radius: 18px; padding: 26px 20px; text-align: center; margin: 26px 0; box-shadow: 0 8px 24px rgba(0,0,0,0.5);'>
                <div style='color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;'>
                  Your 6-Digit One-Time Security Code
                </div>

                <!-- Big Selectable OTP Code -->
                <div style='background: #020617; display: inline-block; padding: 14px 32px; border-radius: 14px; border: 2px solid #1e3a5f; margin: 4px 0; box-shadow: 0 4px 16px rgba(0,0,0,0.4);'>
                  <span style='color: #38bdf8; font-family: \"Courier New\", Courier, monospace; font-size: 44px; font-weight: 900; letter-spacing: 12px; user-select: all; -webkit-user-select: all; -moz-user-select: all; text-shadow: 0 2px 14px rgba(56, 189, 248, 0.45);'>
                    {$params['otp']}
                  </span>
                </div>

                <!-- Click to Copy Container directly under the OTP Code -->
                <div style='margin-top: 18px;'>
                  <div style='display: inline-block; background: linear-gradient(135deg, #0f2744 0%, #163e6e 100%); border: 1.5px solid #38bdf8; padding: 10px 24px; border-radius: 10px; cursor: copy; user-select: all; -webkit-user-select: all; -moz-user-select: all; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.2);'>
                    <span style='color: #93c5fd; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;'>
                      📋 Click to Copy:
                    </span>
                    <span style='display: inline-block; margin-left: 8px; font-family: \"Courier New\", monospace; font-size: 18px; font-weight: 900; color: #ffffff; background: #020617; padding: 3px 10px; border-radius: 6px; border: 1px solid #60a5fa; letter-spacing: 3px;'>
                      {$params['otp']}
                    </span>
                  </div>
                  <div style='color: #64748b; font-size: 10px; margin-top: 6px;'>
                    (Tap or click the box above to immediately select &amp; copy your 6-digit code)
                  </div>
                </div>

                <div style='color: #94a3b8; font-size: 12px; margin-top: 16px; font-weight: 500;'>
                  ⏱ Security code is valid for <strong>{$params['expiry_mins']} minutes</strong> only &bull; Single-use security token
                </div>
              </div>

              <!-- Automated No-Reply Notice -->
              <div style='background-color: #1a1625; border: 1px solid #dc2626; border-left: 5px solid #ef4444; padding: 14px 18px; border-radius: 8px; margin: 24px 0;'>
                <div style='color: #f87171; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;'>
                  ⚠️ Automated Dispatch - Please Do Not Reply
                </div>
                <div style='color: #cbd5e1; font-size: 12px; line-height: 1.5;'>
                  This is an automated institutional message sent from a notification-only address (<strong>noreply@fccibadanlibrary.com.ng</strong>). <strong>Direct replies to this email will not be received or answered.</strong> If you need help, please contact library staff through the portal or visit the physical circulation desk.
                </div>
              </div>

              <!-- Security Advice -->
              <div style='background-color: #1e1b4b; border-left: 4px solid #6366f1; padding: 14px 18px; border-radius: 8px; margin: 24px 0;'>
                <p style='margin: 0; color: #c7d2fe; font-size: 12px; line-height: 1.5;'>
                  <strong>Security Advisory:</strong> {$params['security_tip']}
                </p>
              </div>

              <p style='margin: 20px 0 0 0; color: #64748b; font-size: 12px;'>
                This automated dispatch was generated by the Federal Cooperative College Central Authentication Gateway.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style='background-color: #080e1a; padding: 22px 30px; border-top: 1px solid #1e293b; text-align: center;'>
              <div style='display: inline-block; background-color: #261616; border: 1px solid #7f1d1d; color: #fca5a5; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px;'>
                ⛔ Do Not Reply &bull; Unmonitored Mailbox
              </div>
              <p style='margin: 4px 0; color: #64748b; font-size: 11px;'>
                Federal Cooperative College, Eleyele Road, P.M.B. 5033, Ibadan, Oyo State, Nigeria.
              </p>
              <p style='margin: 6px 0 0 0; color: #475569; font-size: 10px;'>
                &copy; {$year} FCC Smart Library System &bull; All Rights Reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
";
    }

    /**
     * General Patron Notification Template with School Logo
     */
    private static function buildNotificationEmailTemplate(array $params): string
    {
        $year = date('Y');
        return "
<!DOCTYPE html>
<html lang='en'>
<head>
<meta charset='UTF-8'>
<meta name='viewport' content='width=device-width, initial-scale=1.0'>
<title>{$params['title']}</title>
</head>
<body style='margin:0; padding:0; background-color:#070d17; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>
  <table role='presentation' width='100%' cellspacing='0' cellpadding='0' border='0' style='background-color:#070d17; padding: 30px 15px;'>
    <tr>
      <td align='center'>
        <table role='presentation' width='100%' style='max-width: 580px; background-color:#0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow:hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);'>
          
          <!-- Header with Logo -->
          <tr>
            <td style='background: linear-gradient(135deg, #051326 0%, #0d2818 100%); padding: 26px 28px; border-bottom: 3px solid #10b981;'>
              <table role='presentation' width='100%' cellspacing='0' cellpadding='0' border='0'>
                <tr>
                  <td width='72' valign='middle' style='padding-right: 18px;'>
                    <img src='cid:school_logo' alt='Federal Cooperative College Logo' width='64' height='64' style='display: block; border-radius: 12px; background-color: #ffffff; padding: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid #10b981;' />
                  </td>
                  <td valign='middle'>
                    <div style='display: inline-block; background-color: #10b981; color: #022c22; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;'>
                      {$params['type']} NOTIFICATION
                    </div>
                    <h1 style='margin: 8px 0 2px 0; color: #ffffff; font-size: 20px; font-weight: 800;'>
                      FCC Smart Library Notice
                    </h1>
                    <p style='margin: 0; color: #94a3b8; font-size: 12px;'>
                      {$params['title']}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style='padding: 32px 30px;'>
              <p style='color: #cbd5e1; font-size: 15px; margin: 0 0 16px 0;'>
                Dear <strong>{$params['name']}</strong>,
              </p>
              <div style='color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; white-space: pre-line;'>
                {$params['message']}
              </div>

              <div style='text-align: center; margin: 30px 0;'>
                <a href='{$params['action_url']}' style='display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 12px; text-decoration: none; box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);'>
                  {$params['action_text']} &rarr;
                </a>
              </div>

              <!-- Automated No-Reply Notice -->
              <div style='background-color: #1a1625; border: 1px solid #dc2626; border-left: 5px solid #ef4444; padding: 14px 18px; border-radius: 8px; margin: 24px 0;'>
                <div style='color: #f87171; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;'>
                  ⚠️ Automated Dispatch - Please Do Not Reply
                </div>
                <div style='color: #cbd5e1; font-size: 12px; line-height: 1.5;'>
                  This is an automated institutional notification dispatched from an unmonitored system address (<strong>noreply@fccibadanlibrary.com.ng</strong>). <strong>Replies to this email cannot be received or answered.</strong> If you require assistance, please log in to the library portal or contact staff at the library circulation desk.
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style='background-color: #080e1a; padding: 22px 30px; border-top: 1px solid #1e293b; text-align: center;'>
              <div style='display: inline-block; background-color: #261616; border: 1px solid #7f1d1d; color: #fca5a5; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px;'>
                ⛔ Do Not Reply &bull; Unmonitored Mailbox
              </div>
              <p style='margin: 4px 0; color: #64748b; font-size: 11px;'>
                Federal Cooperative College Library Directorate, Eleyele, Ibadan, Oyo State, Nigeria.
              </p>
              <p style='margin: 6px 0 0 0; color: #475569; font-size: 10px;'>
                &copy; {$year} FCC Smart Library System &bull; All Rights Reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
";
    }
}
