"""Email and SMS provider abstraction layer.

Supports SMTP, Mailgun, SendGrid, and a stub SMS adapter.
"""
import logging
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class EmailResult:
    """Result of sending an email."""
    success: bool
    message_id: str = ""
    error: str = ""


# ---------------------------------------------------------------------------
# Base provider
# ---------------------------------------------------------------------------

class BaseEmailProvider:
    """Abstract base for email providers."""

    def __init__(self, config=None):
        self.config = config or {}

    def send(self, to, subject, body, from_email=None, html_body=None, **kwargs):
        """Send an email. Returns EmailResult."""
        raise NotImplementedError


# ---------------------------------------------------------------------------
# SMTP provider
# ---------------------------------------------------------------------------

class SMTPEmailProvider(BaseEmailProvider):
    """Send email via Django's built-in SMTP backend."""

    def send(self, to, subject, body, from_email=None, html_body=None, **kwargs):
        try:
            from django.core.mail import EmailMultiAlternatives

            msg = EmailMultiAlternatives(
                subject=subject,
                body=body,
                from_email=from_email,
                to=[to] if isinstance(to, str) else to,
            )
            if html_body:
                msg.attach_alternative(html_body, "text/html")

            sent = msg.send(fail_silently=False)
            return EmailResult(success=bool(sent), message_id=str(sent))
        except Exception as e:
            logger.error("SMTP send failed: %s", e)
            return EmailResult(success=False, error=str(e))


# ---------------------------------------------------------------------------
# Mailgun provider
# ---------------------------------------------------------------------------

class MailgunEmailProvider(BaseEmailProvider):
    """Send email via Mailgun HTTP API."""

    def send(self, to, subject, body, from_email=None, html_body=None, **kwargs):
        try:
            import requests
        except ImportError:
            return EmailResult(success=False, error="requests library not installed")

        api_key = self.config.get("api_key")
        domain = self.config.get("domain")
        if not api_key or not domain:
            return EmailResult(
                success=False,
                error="Mailgun api_key and domain required in config",
            )

        data = {
            "from": from_email or f"noreply@{domain}",
            "to": [to] if isinstance(to, str) else to,
            "subject": subject,
            "text": body,
        }
        if html_body:
            data["html"] = html_body

        try:
            resp = requests.post(
                f"https://api.mailgun.net/v3/{domain}/messages",
                auth=("api", api_key),
                data=data,
                timeout=30,
            )
            if resp.status_code == 200:
                return EmailResult(
                    success=True,
                    message_id=resp.json().get("id", ""),
                )
            return EmailResult(
                success=False,
                error=f"Mailgun HTTP {resp.status_code}: {resp.text}",
            )
        except Exception as e:
            logger.error("Mailgun send failed: %s", e)
            return EmailResult(success=False, error=str(e))


# ---------------------------------------------------------------------------
# SendGrid provider
# ---------------------------------------------------------------------------

class SendGridEmailProvider(BaseEmailProvider):
    """Send email via SendGrid HTTP API."""

    def send(self, to, subject, body, from_email=None, html_body=None, **kwargs):
        try:
            import requests
        except ImportError:
            return EmailResult(success=False, error="requests library not installed")

        api_key = self.config.get("api_key")
        if not api_key:
            return EmailResult(
                success=False,
                error="SendGrid api_key required in config",
            )

        payload = {
            "personalizations": [{"to": [{"email": to}]}],
            "from": {"email": from_email or "noreply@example.com"},
            "subject": subject,
            "content": [{"type": "text/plain", "value": body}],
        }
        if html_body:
            payload["content"].append({"type": "text/html", "value": html_body})

        try:
            resp = requests.post(
                "https://api.sendgrid.com/v3/mail/send",
                json=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                timeout=30,
            )
            if resp.status_code in (200, 202):
                return EmailResult(
                    success=True,
                    message_id=resp.headers.get("X-Message-Id", ""),
                )
            return EmailResult(
                success=False,
                error=f"SendGrid HTTP {resp.status_code}: {resp.text}",
            )
        except Exception as e:
            logger.error("SendGrid send failed: %s", e)
            return EmailResult(success=False, error=str(e))


# ---------------------------------------------------------------------------
# Console/Log provider (for development/testing)
# ---------------------------------------------------------------------------

class ConsoleEmailProvider(BaseEmailProvider):
    """Print emails to console/log. Used in development and testing."""

    sent_messages = []  # class-level list for test inspection

    def send(self, to, subject, body, from_email=None, html_body=None, **kwargs):
        msg = {
            "to": to,
            "subject": subject,
            "body": body,
            "from_email": from_email,
        }
        self.sent_messages.append(msg)
        logger.info("Email to=%s subject=%s", to, subject)
        return EmailResult(success=True, message_id=f"console-{len(self.sent_messages)}")

    @classmethod
    def reset(cls):
        cls.sent_messages = []


# ---------------------------------------------------------------------------
# SMS stub
# ---------------------------------------------------------------------------

class SMSProvider:
    """Stub SMS provider interface.

    TODO: Implement with Twilio, AWS SNS, or other SMS gateway.
    """

    def __init__(self, config=None):
        self.config = config or {}

    def send(self, to, message, from_number=None):
        """Send an SMS. Currently a stub that logs the message."""
        logger.info("SMS stub: to=%s message=%s", to, message[:50])
        return {"success": False, "error": "SMS not yet implemented"}


# ---------------------------------------------------------------------------
# Provider factory
# ---------------------------------------------------------------------------

PROVIDERS = {
    "smtp": SMTPEmailProvider,
    "mailgun": MailgunEmailProvider,
    "sendgrid": SendGridEmailProvider,
    "console": ConsoleEmailProvider,
}

# Override for testing
_provider_override = None


def set_email_provider_override(provider):
    """Set a global provider override (useful for testing)."""
    global _provider_override
    _provider_override = provider


def clear_email_provider_override():
    """Clear the global provider override."""
    global _provider_override
    _provider_override = None


def get_email_provider(org):
    """Get the configured email provider for an organization.

    Returns an instance of the appropriate provider class.
    """
    if _provider_override:
        return _provider_override

    provider_name = getattr(org, "email_provider", "smtp")
    config = getattr(org, "email_config", {})
    provider_class = PROVIDERS.get(provider_name, SMTPEmailProvider)
    return provider_class(config=config)
