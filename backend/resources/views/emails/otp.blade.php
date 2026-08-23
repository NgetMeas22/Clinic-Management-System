<!DOCTYPE html>
<html>
<body style="margin:0; padding:24px; background-color:#f1f5f9; font-family:'Segoe UI', Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                       style="max-width:480px; background-color:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0;">
                    <tr>
                        <td style="background-color:#2563eb; padding:20px 32px; text-align:center;">
                            <h1 style="margin:0; color:#ffffff; font-size:18px; font-weight:700;">NGMClinic</h1>
                            <p style="margin:4px 0 0; color:#dbeafe; font-size:12px;">Secure Clinical Portal</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px; text-align:center;">
                            <h2 style="margin:0 0 8px; color:#1e293b; font-size:18px;">Your login code</h2>
                            <p style="margin:0 0 20px; color:#64748b; font-size:13px;">
                                Hi {{ $name }}, use the code below to sign in.
                                It expires in {{ $ttlMinutes }} minutes.
                            </p>
                            <div style="display:inline-block; padding:14px 28px; border-radius:12px;
                                        background-color:#eff6ff; border:1px dashed #2563eb;">
                                <span style="font-size:30px; font-weight:700; letter-spacing:10px; color:#2563eb;">{{ $code }}</span>
                            </div>
                            <p style="margin:20px 0 0; color:#94a3b8; font-size:12px;">
                                ប្រើកូដនេះដើម្បីចូលប្រើប្រព័ន្ធ NGM Clinic។ កូដនឹងផុតកំណត់ within {{ $ttlMinutes }} នាទី។
                            </p>
                            <p style="margin:24px 0 0; color:#cbd5e1; font-size:11px;">
                                If you did not request this code, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
