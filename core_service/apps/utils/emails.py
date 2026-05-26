from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags

def send_verification_otp(email, otp_code):
    """
    Sends a beautiful HTML OTP email for signup verification.
    """
    subject = "MeraPaisa - Verify Your Email Address"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Email Verification</title>
        <style>
            body {{
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #f1f5f9;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            }}
            .header {{
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                padding: 30px 20px;
                text-align: center;
            }}
            .header h1 {{
                color: #ffffff;
                font-size: 28px;
                margin: 0;
                letter-spacing: -0.5px;
                font-weight: 800;
            }}
            .content {{
                padding: 40px 30px;
                color: #334155;
            }}
            .content p {{
                font-size: 16px;
                line-height: 1.6;
                margin-top: 0;
            }}
            .otp-box {{
                background-color: #f8fafc;
                border: 2px dashed #cbd5e1;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                margin: 30px 0;
            }}
            .otp-code {{
                font-size: 36px;
                font-weight: 800;
                letter-spacing: 6px;
                color: #10b981;
                margin: 0;
            }}
            .footer {{
                background-color: #f8fafc;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #94a3b8;
                border-top: 1px solid #e2e8f0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MeraPaisa</h1>
            </div>
            <div class="content">
                <p>Welcome to MeraPaisa! To complete your registration and secure your personal finance dashboard, please verify your email address using the 6-digit verification code below:</p>
                <div class="otp-box">
                    <div class="otp-code">{otp_code}</div>
                </div>
                <p>This verification code is valid for 30 minutes. If you did not register for a MeraPaisa account, please ignore this email.</p>
            </div>
            <div class="footer">
                &copy; 2026 MeraPaisa Inc. Securely Managing Wealth.
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = strip_tags(html_content)
    
    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        to=[email]
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send()


def send_reset_otp(email, reset_code):
    """
    Sends a beautiful HTML OTP email for password resets.
    """
    subject = "MeraPaisa - Reset Your Password"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Reset Password</title>
        <style>
            body {{
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #f1f5f9;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            }}
            .header {{
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                padding: 30px 20px;
                text-align: center;
            }}
            .header h1 {{
                color: #ffffff;
                font-size: 28px;
                margin: 0;
                letter-spacing: -0.5px;
                font-weight: 800;
            }}
            .content {{
                padding: 40px 30px;
                color: #334155;
            }}
            .content p {{
                font-size: 16px;
                line-height: 1.6;
                margin-top: 0;
            }}
            .otp-box {{
                background-color: #f8fafc;
                border: 2px dashed #cbd5e1;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                margin: 30px 0;
            }}
            .otp-code {{
                font-size: 36px;
                font-weight: 800;
                letter-spacing: 6px;
                color: #ef4444;
                margin: 0;
            }}
            .footer {{
                background-color: #f8fafc;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #94a3b8;
                border-top: 1px solid #e2e8f0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MeraPaisa</h1>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>We received a request to reset the password for your MeraPaisa account. Please use the following 6-digit reset code to securely update your password:</p>
                <div class="otp-box">
                    <div class="otp-code">{reset_code}</div>
                </div>
                <p>This code is valid for 15 minutes. If you did not make this request, please change your account password immediately to keep your account secure.</p>
            </div>
            <div class="footer">
                &copy; 2026 MeraPaisa Inc. Securely Managing Wealth.
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = strip_tags(html_content)
    
    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        to=[email]
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send()
