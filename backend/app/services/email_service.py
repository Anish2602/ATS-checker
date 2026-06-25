import os
import requests
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

class EmailService:
    @staticmethod
    def _send_email(to_email: str, subject: str, html_content: str) -> bool:
        """Sends email using Resend REST API or logs to output if API key is missing."""
        if not RESEND_API_KEY:
            logger.info("\n" + "="*80 + f"\n[LOCAL EMAIL CARRIER FALLBACK]\nTo: {to_email}\nSubject: {subject}\nContent:\n{html_content}\n" + "="*80)
            # Write to a file in app root for easy checking if needed
            try:
                os.makedirs("email_logs", exist_ok=True)
                with open(f"email_logs/{to_email.replace('@', '_')}.html", "w") as f:
                    f.write(html_content)
            except Exception as e:
                logger.error(f"Failed to write local email log: {e}")
            return True

        try:
            url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "from": RESEND_FROM_EMAIL,
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code in [200, 201, 202]:
                logger.info(f"Email successfully sent via Resend to {to_email}")
                return True
            else:
                logger.error(f"Resend returned error: status_code={response.status_code}, response={response.text}")
                return False
        except Exception as e:
            logger.error(f"Exception during email delivery to {to_email}: {e}")
            return False

    @classmethod
    def send_verification_email(cls, email: str, name: str, token: str) -> bool:
        verification_link = f"{FRONTEND_URL}/verify-email?token={token}"
        subject = "Verify your email address for ATS Optimize"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff; color: #333333;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #4285f4; margin: 0; font-size: 24px; font-weight: bold;">ATS Optimize</h1>
                <p style="font-size: 14px; color: #777777; margin-top: 5px;">Enterprise Resume Matchmaker</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.5;">Hi {name or 'there'},</p>
            <p style="font-size: 16px; line-height: 1.5;">Thank you for registering on ATS Optimize! To activate your account and start matching resumes, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verification_link}" style="background-color: #4285f4; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">Verify Email Address</a>
            </div>
            
            <p style="font-size: 14px; line-height: 1.5; color: #555555;">If you cannot click the button above, copy and paste this URL into your browser:</p>
            <p style="font-size: 14px; line-height: 1.5; word-break: break-all; color: #4285f4;"><a href="{verification_link}">{verification_link}</a></p>
            
            <p style="font-size: 12px; line-height: 1.5; color: #999999; margin-top: 40px; text-align: center;">This verification link will expire in 24 hours. If you did not sign up for this account, you can safely ignore this email.</p>
        </div>
        """
        return cls._send_email(email, subject, html_content)

    @classmethod
    def send_password_reset_email(cls, email: str, name: str, token: str) -> bool:
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
        subject = "Reset your ATS Optimize password"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff; color: #333333;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #ea4335; margin: 0; font-size: 24px; font-weight: bold;">ATS Optimize</h1>
                <p style="font-size: 14px; color: #777777; margin-top: 5px;">Enterprise Resume Matchmaker</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.5;">Hi {name or 'there'},</p>
            <p style="font-size: 16px; line-height: 1.5;">We received a request to reset the password for your ATS Optimize account. Click the button below to choose a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="background-color: #ea4335; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
            </div>
            
            <p style="font-size: 14px; line-height: 1.5; color: #555555;">If you cannot click the button above, copy and paste this URL into your browser:</p>
            <p style="font-size: 14px; line-height: 1.5; word-break: break-all; color: #ea4335;"><a href="{reset_link}">{reset_link}</a></p>
            
            <p style="font-size: 12px; line-height: 1.5; color: #999999; margin-top: 40px; text-align: center;">This link will expire in 1 hour. If you did not request a password reset, no further action is needed.</p>
        </div>
        """
        return cls._send_email(email, subject, html_content)
