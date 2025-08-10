import uuid as uuid_lib
from django.db import models

class Device(models.Model):
    id = models.BigAutoField(primary_key=True)
    uuid = models.UUIDField(default=uuid_lib.uuid4, unique=True, db_index=True)
    last_link = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Device {self.uuid}"