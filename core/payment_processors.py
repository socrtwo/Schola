"""Payment processor abstraction layer.

Supports Square, Stripe, PayPal, and custom processors.
Each processor implements a common interface for creating charges,
refunds, and checkout sessions.
"""
import logging
from dataclasses import dataclass
from decimal import Decimal

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Result types
# ---------------------------------------------------------------------------

@dataclass
class PaymentResult:
    """Result of a payment processor operation."""
    success: bool
    transaction_id: str = ""
    payment_id: str = ""
    checkout_url: str = ""
    error: str = ""
    raw_response: dict = None

    def __post_init__(self):
        if self.raw_response is None:
            self.raw_response = {}


@dataclass
class RefundResult:
    """Result of a refund operation."""
    success: bool
    refund_id: str = ""
    error: str = ""
    raw_response: dict = None

    def __post_init__(self):
        if self.raw_response is None:
            self.raw_response = {}


# ---------------------------------------------------------------------------
# Base processor
# ---------------------------------------------------------------------------

class BasePaymentProcessor:
    """Abstract base for payment processors.

    Subclasses implement the actual API calls for each provider.
    """

    def __init__(self, credentials=None, config=None, mode="sandbox"):
        self.credentials = credentials or {}
        self.config = config or {}
        self.mode = mode

    @property
    def processor_type(self):
        raise NotImplementedError

    def validate_credentials(self):
        """Check that required credentials are present. Returns (ok, errors)."""
        raise NotImplementedError

    def create_checkout(self, amount, currency="USD", description="",
                        customer_email="", return_url="", cancel_url="",
                        metadata=None):
        """Create a hosted checkout session.

        Returns PaymentResult with checkout_url set on success.
        """
        raise NotImplementedError

    def charge(self, amount, currency="USD", description="",
               source_token="", customer_email="", metadata=None):
        """Create a direct charge/payment.

        Returns PaymentResult with transaction_id set on success.
        """
        raise NotImplementedError

    def refund(self, transaction_id, amount=None, reason=""):
        """Refund a previous payment (full or partial).

        If amount is None, refunds the full original amount.
        Returns RefundResult.
        """
        raise NotImplementedError

    def get_transaction(self, transaction_id):
        """Retrieve transaction details. Returns dict or None."""
        raise NotImplementedError


# ---------------------------------------------------------------------------
# Square processor
# ---------------------------------------------------------------------------

class SquareProcessor(BasePaymentProcessor):
    """Square payment processor.

    Credentials: {app_id, access_token, location_id}
    """

    @property
    def processor_type(self):
        return "square"

    @property
    def _base_url(self):
        if self.mode == "production":
            return "https://connect.squareup.com"
        return "https://connect.squareupsandbox.com"

    @property
    def _headers(self):
        return {
            "Authorization": f"Bearer {self.credentials.get('access_token', '')}",
            "Content-Type": "application/json",
            "Square-Version": "2024-01-18",
        }

    def validate_credentials(self):
        required = ["app_id", "access_token", "location_id"]
        missing = [k for k in required if not self.credentials.get(k)]
        if missing:
            return False, [f"Missing: {', '.join(missing)}"]
        return True, []

    def create_checkout(self, amount, currency="USD", description="",
                        customer_email="", return_url="", cancel_url="",
                        metadata=None):
        try:
            import requests
            import uuid
        except ImportError:
            return PaymentResult(success=False, error="requests library required")

        ok, errors = self.validate_credentials()
        if not ok:
            return PaymentResult(success=False, error="; ".join(errors))

        idempotency_key = str(uuid.uuid4())
        amount_cents = int(amount * 100)

        payload = {
            "idempotency_key": idempotency_key,
            "order": {
                "order": {
                    "location_id": self.credentials["location_id"],
                    "line_items": [{
                        "name": description or "Registration",
                        "quantity": "1",
                        "base_price_money": {
                            "amount": amount_cents,
                            "currency": currency,
                        },
                    }],
                },
            },
        }
        if return_url:
            payload["redirect_url"] = return_url
        if customer_email:
            payload["pre_populate_buyer_email"] = customer_email

        try:
            resp = requests.post(
                f"{self._base_url}/v2/online-checkout/payment-links",
                json=payload,
                headers=self._headers,
                timeout=30,
            )
            data = resp.json()
            if resp.status_code in (200, 201):
                link = data.get("payment_link", {})
                return PaymentResult(
                    success=True,
                    transaction_id=link.get("id", ""),
                    checkout_url=link.get("url", ""),
                    raw_response=data,
                )
            return PaymentResult(
                success=False,
                error=f"Square HTTP {resp.status_code}: {data.get('errors', resp.text)}",
                raw_response=data,
            )
        except Exception as e:
            logger.error("Square checkout error: %s", e)
            return PaymentResult(success=False, error=str(e))

    def charge(self, amount, currency="USD", description="",
               source_token="", customer_email="", metadata=None):
        try:
            import requests
            import uuid
        except ImportError:
            return PaymentResult(success=False, error="requests library required")

        ok, errors = self.validate_credentials()
        if not ok:
            return PaymentResult(success=False, error="; ".join(errors))

        amount_cents = int(amount * 100)
        payload = {
            "idempotency_key": str(uuid.uuid4()),
            "source_id": source_token or "EXTERNAL",
            "amount_money": {"amount": amount_cents, "currency": currency},
            "location_id": self.credentials["location_id"],
            "note": description,
        }

        try:
            resp = requests.post(
                f"{self._base_url}/v2/payments",
                json=payload,
                headers=self._headers,
                timeout=30,
            )
            data = resp.json()
            if resp.status_code in (200, 201):
                payment = data.get("payment", {})
                return PaymentResult(
                    success=True,
                    transaction_id=payment.get("order_id", ""),
                    payment_id=payment.get("id", ""),
                    raw_response=data,
                )
            return PaymentResult(
                success=False,
                error=f"Square HTTP {resp.status_code}: {data.get('errors', resp.text)}",
                raw_response=data,
            )
        except Exception as e:
            logger.error("Square charge error: %s", e)
            return PaymentResult(success=False, error=str(e))

    def refund(self, transaction_id, amount=None, reason=""):
        try:
            import requests
            import uuid
        except ImportError:
            return RefundResult(success=False, error="requests library required")

        ok, errors = self.validate_credentials()
        if not ok:
            return RefundResult(success=False, error="; ".join(errors))

        payload = {
            "idempotency_key": str(uuid.uuid4()),
            "payment_id": transaction_id,
            "reason": reason,
        }
        if amount is not None:
            payload["amount_money"] = {
                "amount": int(amount * 100),
                "currency": self.config.get("currency", "USD"),
            }

        try:
            resp = requests.post(
                f"{self._base_url}/v2/refunds",
                json=payload,
                headers=self._headers,
                timeout=30,
            )
            data = resp.json()
            if resp.status_code in (200, 201):
                return RefundResult(
                    success=True,
                    refund_id=data.get("refund", {}).get("id", ""),
                    raw_response=data,
                )
            return RefundResult(
                success=False,
                error=f"Square HTTP {resp.status_code}: {data.get('errors', resp.text)}",
                raw_response=data,
            )
        except Exception as e:
            logger.error("Square refund error: %s", e)
            return RefundResult(success=False, error=str(e))

    def get_transaction(self, transaction_id):
        try:
            import requests
        except ImportError:
            return None
        try:
            resp = requests.get(
                f"{self._base_url}/v2/payments/{transaction_id}",
                headers=self._headers,
                timeout=30,
            )
            if resp.status_code == 200:
                return resp.json().get("payment")
        except Exception as e:
            logger.error("Square get_transaction error: %s", e)
        return None


# ---------------------------------------------------------------------------
# Stripe processor
# ---------------------------------------------------------------------------

class StripeProcessor(BasePaymentProcessor):
    """Stripe payment processor.

    Credentials: {publishable_key, secret_key, webhook_secret}
    """

    @property
    def processor_type(self):
        return "stripe"

    @property
    def _base_url(self):
        return "https://api.stripe.com/v1"

    @property
    def _headers(self):
        return {
            "Authorization": f"Bearer {self.credentials.get('secret_key', '')}",
        }

    def validate_credentials(self):
        required = ["secret_key", "publishable_key"]
        missing = [k for k in required if not self.credentials.get(k)]
        if missing:
            return False, [f"Missing: {', '.join(missing)}"]
        return True, []

    def create_checkout(self, amount, currency="USD", description="",
                        customer_email="", return_url="", cancel_url="",
                        metadata=None):
        try:
            import requests
        except ImportError:
            return PaymentResult(success=False, error="requests library required")

        ok, errors = self.validate_credentials()
        if not ok:
            return PaymentResult(success=False, error="; ".join(errors))

        amount_cents = int(amount * 100)
        data = {
            "mode": "payment",
            "line_items[0][price_data][currency]": currency.lower(),
            "line_items[0][price_data][product_data][name]": description or "Registration",
            "line_items[0][price_data][unit_amount]": str(amount_cents),
            "line_items[0][quantity]": "1",
        }
        if return_url:
            data["success_url"] = return_url
        if cancel_url:
            data["cancel_url"] = cancel_url
        if customer_email:
            data["customer_email"] = customer_email
        if metadata:
            for k, v in metadata.items():
                data[f"metadata[{k}]"] = str(v)

        try:
            resp = requests.post(
                f"{self._base_url}/checkout/sessions",
                data=data,
                headers=self._headers,
                timeout=30,
            )
            result = resp.json()
            if resp.status_code == 200:
                return PaymentResult(
                    success=True,
                    transaction_id=result.get("id", ""),
                    payment_id=result.get("payment_intent", ""),
                    checkout_url=result.get("url", ""),
                    raw_response=result,
                )
            return PaymentResult(
                success=False,
                error=f"Stripe HTTP {resp.status_code}: {result.get('error', {}).get('message', resp.text)}",
                raw_response=result,
            )
        except Exception as e:
            logger.error("Stripe checkout error: %s", e)
            return PaymentResult(success=False, error=str(e))

    def charge(self, amount, currency="USD", description="",
               source_token="", customer_email="", metadata=None):
        try:
            import requests
        except ImportError:
            return PaymentResult(success=False, error="requests library required")

        ok, errors = self.validate_credentials()
        if not ok:
            return PaymentResult(success=False, error="; ".join(errors))

        amount_cents = int(amount * 100)
        data = {
            "amount": str(amount_cents),
            "currency": currency.lower(),
            "description": description,
        }
        if source_token:
            data["source"] = source_token
        if metadata:
            for k, v in metadata.items():
                data[f"metadata[{k}]"] = str(v)

        try:
            resp = requests.post(
                f"{self._base_url}/charges",
                data=data,
                headers=self._headers,
                timeout=30,
            )
            result = resp.json()
            if resp.status_code == 200:
                return PaymentResult(
                    success=True,
                    transaction_id=result.get("id", ""),
                    payment_id=result.get("balance_transaction", ""),
                    raw_response=result,
                )
            return PaymentResult(
                success=False,
                error=f"Stripe HTTP {resp.status_code}: {result.get('error', {}).get('message', resp.text)}",
                raw_response=result,
            )
        except Exception as e:
            logger.error("Stripe charge error: %s", e)
            return PaymentResult(success=False, error=str(e))

    def refund(self, transaction_id, amount=None, reason=""):
        try:
            import requests
        except ImportError:
            return RefundResult(success=False, error="requests library required")

        ok, errors = self.validate_credentials()
        if not ok:
            return RefundResult(success=False, error="; ".join(errors))

        data = {"charge": transaction_id}
        if amount is not None:
            data["amount"] = str(int(amount * 100))
        if reason:
            data["reason"] = "requested_by_customer"

        try:
            resp = requests.post(
                f"{self._base_url}/refunds",
                data=data,
                headers=self._headers,
                timeout=30,
            )
            result = resp.json()
            if resp.status_code == 200:
                return RefundResult(
                    success=True,
                    refund_id=result.get("id", ""),
                    raw_response=result,
                )
            return RefundResult(
                success=False,
                error=f"Stripe HTTP {resp.status_code}: {result.get('error', {}).get('message', resp.text)}",
                raw_response=result,
            )
        except Exception as e:
            logger.error("Stripe refund error: %s", e)
            return RefundResult(success=False, error=str(e))

    def get_transaction(self, transaction_id):
        try:
            import requests
        except ImportError:
            return None
        try:
            resp = requests.get(
                f"{self._base_url}/charges/{transaction_id}",
                headers=self._headers,
                timeout=30,
            )
            if resp.status_code == 200:
                return resp.json()
        except Exception as e:
            logger.error("Stripe get_transaction error: %s", e)
        return None


# ---------------------------------------------------------------------------
# PayPal processor
# ---------------------------------------------------------------------------

class PayPalProcessor(BasePaymentProcessor):
    """PayPal payment processor.

    Credentials: {client_id, client_secret}
    """

    @property
    def processor_type(self):
        return "paypal"

    @property
    def _base_url(self):
        if self.mode == "production":
            return "https://api-m.paypal.com"
        return "https://api-m.sandbox.paypal.com"

    def validate_credentials(self):
        required = ["client_id", "client_secret"]
        missing = [k for k in required if not self.credentials.get(k)]
        if missing:
            return False, [f"Missing: {', '.join(missing)}"]
        return True, []

    def _get_access_token(self):
        """Get OAuth2 access token from PayPal."""
        try:
            import requests
        except ImportError:
            return None
        try:
            resp = requests.post(
                f"{self._base_url}/v1/oauth2/token",
                data={"grant_type": "client_credentials"},
                auth=(
                    self.credentials.get("client_id", ""),
                    self.credentials.get("client_secret", ""),
                ),
                timeout=30,
            )
            if resp.status_code == 200:
                return resp.json().get("access_token")
        except Exception as e:
            logger.error("PayPal auth error: %s", e)
        return None

    def create_checkout(self, amount, currency="USD", description="",
                        customer_email="", return_url="", cancel_url="",
                        metadata=None):
        try:
            import requests
        except ImportError:
            return PaymentResult(success=False, error="requests library required")

        ok, errors = self.validate_credentials()
        if not ok:
            return PaymentResult(success=False, error="; ".join(errors))

        token = self._get_access_token()
        if not token:
            return PaymentResult(success=False, error="Failed to get PayPal access token")

        payload = {
            "intent": "CAPTURE",
            "purchase_units": [{
                "amount": {
                    "currency_code": currency,
                    "value": str(amount),
                },
                "description": description or "Registration",
            }],
        }
        if return_url and cancel_url:
            payload["application_context"] = {
                "return_url": return_url,
                "cancel_url": cancel_url,
            }

        try:
            resp = requests.post(
                f"{self._base_url}/v2/checkout/orders",
                json=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                timeout=30,
            )
            data = resp.json()
            if resp.status_code in (200, 201):
                approve_url = ""
                for link in data.get("links", []):
                    if link.get("rel") == "approve":
                        approve_url = link.get("href", "")
                        break
                return PaymentResult(
                    success=True,
                    transaction_id=data.get("id", ""),
                    checkout_url=approve_url,
                    raw_response=data,
                )
            return PaymentResult(
                success=False,
                error=f"PayPal HTTP {resp.status_code}: {data}",
                raw_response=data,
            )
        except Exception as e:
            logger.error("PayPal checkout error: %s", e)
            return PaymentResult(success=False, error=str(e))

    def charge(self, amount, currency="USD", description="",
               source_token="", customer_email="", metadata=None):
        # PayPal uses checkout flow; direct charge = create + capture
        result = self.create_checkout(
            amount, currency, description, customer_email,
        )
        if not result.success:
            return result
        # For direct charge, the order needs to be captured separately
        # after customer approval. Return the order ID for capture.
        return result

    def refund(self, transaction_id, amount=None, reason=""):
        try:
            import requests
        except ImportError:
            return RefundResult(success=False, error="requests library required")

        ok, errors = self.validate_credentials()
        if not ok:
            return RefundResult(success=False, error="; ".join(errors))

        token = self._get_access_token()
        if not token:
            return RefundResult(success=False, error="Failed to get PayPal access token")

        payload = {}
        if amount is not None:
            payload["amount"] = {
                "value": str(amount),
                "currency_code": self.config.get("currency", "USD"),
            }
        if reason:
            payload["note_to_payer"] = reason[:255]

        try:
            resp = requests.post(
                f"{self._base_url}/v2/payments/captures/{transaction_id}/refund",
                json=payload if payload else None,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                timeout=30,
            )
            data = resp.json()
            if resp.status_code in (200, 201):
                return RefundResult(
                    success=True,
                    refund_id=data.get("id", ""),
                    raw_response=data,
                )
            return RefundResult(
                success=False,
                error=f"PayPal HTTP {resp.status_code}: {data}",
                raw_response=data,
            )
        except Exception as e:
            logger.error("PayPal refund error: %s", e)
            return RefundResult(success=False, error=str(e))

    def get_transaction(self, transaction_id):
        try:
            import requests
        except ImportError:
            return None
        token = self._get_access_token()
        if not token:
            return None
        try:
            resp = requests.get(
                f"{self._base_url}/v2/checkout/orders/{transaction_id}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=30,
            )
            if resp.status_code == 200:
                return resp.json()
        except Exception as e:
            logger.error("PayPal get_transaction error: %s", e)
        return None


# ---------------------------------------------------------------------------
# Custom processor
# ---------------------------------------------------------------------------

class CustomProcessor(BasePaymentProcessor):
    """Custom/generic payment processor.

    Credentials: {api_url, api_key, ...}
    Config: {charge_endpoint, refund_endpoint, checkout_endpoint, ...}

    Sends JSON POST requests with Bearer token auth to the configured endpoints.
    """

    @property
    def processor_type(self):
        return "custom"

    def validate_credentials(self):
        if not self.credentials.get("api_url"):
            return False, ["Missing: api_url"]
        if not self.credentials.get("api_key"):
            return False, ["Missing: api_key"]
        return True, []

    @property
    def _headers(self):
        return {
            "Authorization": f"Bearer {self.credentials.get('api_key', '')}",
            "Content-Type": "application/json",
        }

    def create_checkout(self, amount, currency="USD", description="",
                        customer_email="", return_url="", cancel_url="",
                        metadata=None):
        try:
            import requests
        except ImportError:
            return PaymentResult(success=False, error="requests library required")

        ok, errors = self.validate_credentials()
        if not ok:
            return PaymentResult(success=False, error="; ".join(errors))

        endpoint = self.config.get("checkout_endpoint", "/checkout")
        url = f"{self.credentials['api_url'].rstrip('/')}{endpoint}"

        payload = {
            "amount": str(amount),
            "currency": currency,
            "description": description,
            "customer_email": customer_email,
            "return_url": return_url,
            "cancel_url": cancel_url,
            "metadata": metadata or {},
        }

        try:
            resp = requests.post(url, json=payload, headers=self._headers, timeout=30)
            data = resp.json()
            if resp.status_code in (200, 201):
                return PaymentResult(
                    success=True,
                    transaction_id=data.get("transaction_id", data.get("id", "")),
                    checkout_url=data.get("checkout_url", data.get("url", "")),
                    raw_response=data,
                )
            return PaymentResult(
                success=False,
                error=f"Custom HTTP {resp.status_code}: {resp.text}",
                raw_response=data,
            )
        except Exception as e:
            logger.error("Custom checkout error: %s", e)
            return PaymentResult(success=False, error=str(e))

    def charge(self, amount, currency="USD", description="",
               source_token="", customer_email="", metadata=None):
        try:
            import requests
        except ImportError:
            return PaymentResult(success=False, error="requests library required")

        ok, errors = self.validate_credentials()
        if not ok:
            return PaymentResult(success=False, error="; ".join(errors))

        endpoint = self.config.get("charge_endpoint", "/charge")
        url = f"{self.credentials['api_url'].rstrip('/')}{endpoint}"

        payload = {
            "amount": str(amount),
            "currency": currency,
            "description": description,
            "source_token": source_token,
            "customer_email": customer_email,
            "metadata": metadata or {},
        }

        try:
            resp = requests.post(url, json=payload, headers=self._headers, timeout=30)
            data = resp.json()
            if resp.status_code in (200, 201):
                return PaymentResult(
                    success=True,
                    transaction_id=data.get("transaction_id", data.get("id", "")),
                    payment_id=data.get("payment_id", ""),
                    raw_response=data,
                )
            return PaymentResult(
                success=False,
                error=f"Custom HTTP {resp.status_code}: {resp.text}",
                raw_response=data,
            )
        except Exception as e:
            logger.error("Custom charge error: %s", e)
            return PaymentResult(success=False, error=str(e))

    def refund(self, transaction_id, amount=None, reason=""):
        try:
            import requests
        except ImportError:
            return RefundResult(success=False, error="requests library required")

        ok, errors = self.validate_credentials()
        if not ok:
            return RefundResult(success=False, error="; ".join(errors))

        endpoint = self.config.get("refund_endpoint", "/refund")
        url = f"{self.credentials['api_url'].rstrip('/')}{endpoint}"

        payload = {
            "transaction_id": transaction_id,
            "reason": reason,
        }
        if amount is not None:
            payload["amount"] = str(amount)

        try:
            resp = requests.post(url, json=payload, headers=self._headers, timeout=30)
            data = resp.json()
            if resp.status_code in (200, 201):
                return RefundResult(
                    success=True,
                    refund_id=data.get("refund_id", data.get("id", "")),
                    raw_response=data,
                )
            return RefundResult(
                success=False,
                error=f"Custom HTTP {resp.status_code}: {resp.text}",
                raw_response=data,
            )
        except Exception as e:
            logger.error("Custom refund error: %s", e)
            return RefundResult(success=False, error=str(e))

    def get_transaction(self, transaction_id):
        try:
            import requests
        except ImportError:
            return None

        endpoint = self.config.get("transaction_endpoint", "/transaction")
        url = f"{self.credentials['api_url'].rstrip('/')}{endpoint}/{transaction_id}"

        try:
            resp = requests.get(url, headers=self._headers, timeout=30)
            if resp.status_code == 200:
                return resp.json()
        except Exception as e:
            logger.error("Custom get_transaction error: %s", e)
        return None


# ---------------------------------------------------------------------------
# Processor registry & factory
# ---------------------------------------------------------------------------

PROCESSORS = {
    "square": SquareProcessor,
    "stripe": StripeProcessor,
    "paypal": PayPalProcessor,
    "custom": CustomProcessor,
}


def get_processor_for_org(org):
    """Get the primary active payment processor for an organization.

    Looks up the PaymentProcessor model and returns an initialized processor.
    Returns None if no active processor is configured.
    """
    from .models import PaymentProcessor

    processor_config = (
        PaymentProcessor.objects
        .filter(organization=org, is_active=True, is_primary=True)
        .first()
    )
    if not processor_config:
        # Fall back to any active processor
        processor_config = (
            PaymentProcessor.objects
            .filter(organization=org, is_active=True)
            .first()
        )

    if not processor_config:
        # Legacy fallback: check org-level Square fields
        if org.square_access_token:
            return SquareProcessor(
                credentials={
                    "app_id": org.square_app_id,
                    "access_token": org.square_access_token,
                    "location_id": org.square_location_id,
                },
                mode=org.square_environment,
            )
        return None

    processor_class = PROCESSORS.get(processor_config.processor_type)
    if not processor_class:
        logger.error(
            "Unknown processor type: %s", processor_config.processor_type,
        )
        return None

    return processor_class(
        credentials=processor_config.credentials,
        config=processor_config.config,
        mode=processor_config.mode,
    )


def get_processor_by_slug(org, slug):
    """Get a specific payment processor by slug for an organization."""
    from .models import PaymentProcessor

    processor_config = (
        PaymentProcessor.objects
        .filter(organization=org, slug=slug, is_active=True)
        .first()
    )
    if not processor_config:
        return None

    processor_class = PROCESSORS.get(processor_config.processor_type)
    if not processor_class:
        return None

    return processor_class(
        credentials=processor_config.credentials,
        config=processor_config.config,
        mode=processor_config.mode,
    )


def list_processors_for_org(org):
    """List all active payment processors for an organization.

    Returns list of (processor_config, processor_instance) tuples.
    """
    from .models import PaymentProcessor

    configs = PaymentProcessor.objects.filter(
        organization=org, is_active=True,
    ).order_by("-is_primary", "name")

    result = []
    for config in configs:
        processor_class = PROCESSORS.get(config.processor_type)
        if processor_class:
            instance = processor_class(
                credentials=config.credentials,
                config=config.config,
                mode=config.mode,
            )
            result.append((config, instance))
    return result
