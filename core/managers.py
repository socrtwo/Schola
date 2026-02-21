from django.db import models


class OrgScopedManager(models.Manager):
    """Manager that filters querysets by organization.

    Usage in views:
        events = Event.objects.for_org(request.org)
    """

    def for_org(self, org):
        return self.get_queryset().filter(organization=org)
