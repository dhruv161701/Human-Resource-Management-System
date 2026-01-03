import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from config import Config


def generate_otp(length=6):
    """Generate a random OTP of specified length"""
    return ''.join(random.choices(string.digits, k=length))


def send_otp_email(to_email, otp):
    """Send OTP verification email"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Dayflow HRMS - Email Verification OTP'
        msg['From'] = Config.EMAIL_ADDRESS
        msg['To'] = to_email

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                .otp-box {{ background-color: #2563eb; color: white; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 8px; text-align: center; letter-spacing: 8px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Dayflow HRMS</h1>
                </div>
                <div class="content">
                    <h2>Email Verification</h2>
                    <p>Hello,</p>
                    <p>Thank you for registering with Dayflow HRMS. Please use the following OTP to verify your email address:</p>
                    <div class="otp-box">{otp}</div>
                    <p>This OTP is valid for <strong>{Config.OTP_EXPIRY_MINUTES} minutes</strong>.</p>
                    <p>If you didn't request this verification, please ignore this email.</p>
                    <p>Best regards,<br>Dayflow HRMS Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Dayflow HRMS - Email Verification
        
        Hello,
        
        Thank you for registering with Dayflow HRMS. Please use the following OTP to verify your email address:
        
        OTP: {otp}
        
        This OTP is valid for {Config.OTP_EXPIRY_MINUTES} minutes.
        
        If you didn't request this verification, please ignore this email.
        
        Best regards,
        Dayflow HRMS Team
        """

        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        msg.attach(part1)
        msg.attach(part2)

        with smtplib.SMTP(Config.SMTP_SERVER, Config.SMTP_PORT) as server:
            server.starttls()
            server.login(Config.EMAIL_ADDRESS, Config.EMAIL_PASSWORD)
            server.sendmail(Config.EMAIL_ADDRESS, to_email, msg.as_string())

        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


def send_timesheet_notification(to_email, employee_name, status, week_start, week_end, comments=None):
    """Send timesheet status notification email"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'Dayflow HRMS - Timesheet {status.capitalize()}'
        msg['From'] = Config.EMAIL_ADDRESS
        msg['To'] = to_email

        status_color = '#10b981' if status == 'approved' else '#ef4444'
        status_text = 'Approved' if status == 'approved' else 'Rejected'

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                .status-box {{ background-color: {status_color}; color: white; font-size: 24px; font-weight: bold; padding: 15px 30px; border-radius: 8px; text-align: center; margin: 20px 0; }}
                .details {{ background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Dayflow HRMS</h1>
                </div>
                <div class="content">
                    <h2>Timesheet Status Update</h2>
                    <p>Hello {employee_name},</p>
                    <p>Your timesheet has been reviewed by your manager.</p>
                    <div class="status-box">{status_text}</div>
                    <div class="details">
                        <p><strong>Week Period:</strong> {week_start} to {week_end}</p>
                        {f'<p><strong>Comments:</strong> {comments}</p>' if comments else ''}
                    </div>
                    <p>{'You can now submit your timesheet for the next week.' if status == 'approved' else 'Please contact your manager for more details.'}</p>
                    <p>Best regards,<br>Dayflow HRMS Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """

        part = MIMEText(html_content, 'html')
        msg.attach(part)

        with smtplib.SMTP(Config.SMTP_SERVER, Config.SMTP_PORT) as server:
            server.starttls()
            server.login(Config.EMAIL_ADDRESS, Config.EMAIL_PASSWORD)
            server.sendmail(Config.EMAIL_ADDRESS, to_email, msg.as_string())

        return True
    except Exception as e:
        print(f"Error sending timesheet email: {e}")
        return False


def send_document_request_email(to_email, employee_name, document_type, description, due_date):
    """Send document request notification email to employee"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'Dayflow HRMS - Document Upload Request: {document_type}'
        msg['From'] = Config.EMAIL_ADDRESS
        msg['To'] = to_email

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                .doc-box {{ background-color: #fef3c7; color: #92400e; font-size: 18px; font-weight: bold; padding: 15px 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #f59e0b; }}
                .details {{ background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Dayflow HRMS</h1>
                </div>
                <div class="content">
                    <h2>Document Upload Request</h2>
                    <p>Hello {employee_name},</p>
                    <p>The HR department has requested you to upload the following document:</p>
                    <div class="doc-box">{document_type}</div>
                    <div class="details">
                        {f'<p><strong>Description:</strong> {description}</p>' if description else ''}
                        {f'<p><strong>Due Date:</strong> {due_date}</p>' if due_date else ''}
                    </div>
                    <p>Please log in to the Dayflow HRMS portal and upload the requested document at your earliest convenience.</p>
                    <p>Best regards,<br>Dayflow HRMS Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Dayflow HRMS - Document Upload Request
        
        Hello {employee_name},
        
        The HR department has requested you to upload the following document:
        
        Document Type: {document_type}
        {f'Description: {description}' if description else ''}
        {f'Due Date: {due_date}' if due_date else ''}
        
        Please log in to the Dayflow HRMS portal and upload the requested document at your earliest convenience.
        
        Best regards,
        Dayflow HRMS Team
        """

        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        msg.attach(part1)
        msg.attach(part2)

        with smtplib.SMTP(Config.SMTP_SERVER, Config.SMTP_PORT) as server:
            server.starttls()
            server.login(Config.EMAIL_ADDRESS, Config.EMAIL_PASSWORD)
            server.sendmail(Config.EMAIL_ADDRESS, to_email, msg.as_string())

        return True
    except Exception as e:
        print(f"Error sending document request email: {e}")
        return False
