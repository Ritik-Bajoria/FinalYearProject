import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from flask import current_app

class EmailService:
    @staticmethod
    def send_otp_email(email, otp, full_name="User"):
        """Send OTP verification email"""
        try:
            # Email configuration - you can set these in environment variables
            smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
            smtp_port = int(os.getenv('SMTP_PORT', '587'))
            sender_email = os.getenv('SENDER_EMAIL', 'your-email@gmail.com')
            sender_password = os.getenv('SENDER_PASSWORD', 'your-app-password')
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = "Email Verification - University Event Management"
            message["From"] = sender_email
            message["To"] = email
            
            # Create HTML content
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .otp-box {{ background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }}
                    .otp-code {{ font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                    .warning {{ background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎓 Email Verification</h1>
                        <p>University Event Management System</p>
                    </div>
                    <div class="content">
                        <h2>Hello {full_name}!</h2>
                        <p>Thank you for registering with our University Event Management System. To complete your registration, please verify your email address using the code below:</p>
                        
                        <div class="otp-box">
                            <p>Your verification code is:</p>
                            <div class="otp-code">{otp}</div>
                        </div>
                        
                        <div class="warning">
                            <strong>⚠️ Important:</strong>
                            <ul>
                                <li>This code will expire in 10 minutes</li>
                                <li>Do not share this code with anyone</li>
                                <li>If you didn't request this, please ignore this email</li>
                            </ul>
                        </div>
                        
                        <p>If you have any questions, please contact our support team.</p>
                        
                        <p>Best regards,<br>
                        <strong>University Event Management Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this message.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Create plain text version
            text_content = f"""
            Email Verification - University Event Management
            
            Hello {full_name}!
            
            Thank you for registering with our University Event Management System.
            To complete your registration, please verify your email address using the code below:
            
            Verification Code: {otp}
            
            Important:
            - This code will expire in 10 minutes
            - Do not share this code with anyone
            - If you didn't request this, please ignore this email
            
            Best regards,
            University Event Management Team
            """
            
            # Attach parts
            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            message.attach(part1)
            message.attach(part2)
            
            # Send email
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(sender_email, sender_password)
                server.send_message(message)
            
            return True, "Email sent successfully"
            
        except Exception as e:
            print(f"Failed to send email: {str(e)}")
            return False, f"Failed to send email: {str(e)}"
    
    @staticmethod
    def send_welcome_email(email, full_name):
        """Send welcome email after successful registration"""
        try:
            smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
            smtp_port = int(os.getenv('SMTP_PORT', '587'))
            sender_email = os.getenv('SENDER_EMAIL', 'your-email@gmail.com')
            sender_password = os.getenv('SENDER_PASSWORD', 'your-app-password')
            
            message = MIMEMultipart("alternative")
            message["Subject"] = "Welcome to University Event Management!"
            message["From"] = sender_email
            message["To"] = email
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Welcome!</h1>
                        <p>University Event Management System</p>
                    </div>
                    <div class="content">
                        <h2>Hello {full_name}!</h2>
                        <p>Congratulations! Your account has been successfully created and verified.</p>
                        <p>You can now:</p>
                        <ul>
                            <li>Browse and register for university events</li>
                            <li>Join student clubs and organizations</li>
                            <li>Create and manage your own events</li>
                            <li>Connect with fellow students</li>
                        </ul>
                        <p>Get started by logging into your account and exploring the platform!</p>
                        <p>Best regards,<br>
                        <strong>University Event Management Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this message.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_content = f"""
            Welcome to University Event Management!
            
            Hello {full_name}!
            
            Congratulations! Your account has been successfully created and verified.
            
            You can now:
            - Browse and register for university events
            - Join student clubs and organizations
            - Create and manage your own events
            - Connect with fellow students
            
            Get started by logging into your account and exploring the platform!
            
            Best regards,
            University Event Management Team
            """
            
            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            message.attach(part1)
            message.attach(part2)
            
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(sender_email, sender_password)
                server.send_message(message)
            
            return True, "Welcome email sent successfully"
            
        except Exception as e:
            print(f"Failed to send welcome email: {str(e)}")
            return False, f"Failed to send welcome email: {str(e)}"