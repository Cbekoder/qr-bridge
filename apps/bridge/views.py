import json
import uuid as uuid_lib
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotAllowed
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Device

def home(request):
    return render(request, "home.html")

def send_view(request):
    return render(request, "send.html")

def receive_view(request):
    device = Device.objects.create()
    return render(request, "receive.html", {"device_uuid": str(device.uuid)})

@csrf_exempt  # prototype; add CSRF protection for production
def api_send(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return HttpResponseBadRequest("Invalid JSON")

    uuid_str = data.get("uuid")
    url = data.get("url")
    if not uuid_str or not url:
        return HttpResponseBadRequest("Missing uuid or url")

    # Validate URL
    validator = URLValidator()
    try:
        validator(url)
    except ValidationError:
        return HttpResponseBadRequest("Invalid URL")

    # Lookup device
    try:
        device = Device.objects.get(uuid=uuid_lib.UUID(uuid_str))
    except (Device.DoesNotExist, ValueError):
        return HttpResponseBadRequest("Device not found")

    device.last_link = url
    device.save(update_fields=["last_link", "updated_at"])

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"device-{uuid_str}",
        {"type": "redirect", "url": url},
    )

    return JsonResponse({"status": "ok"})