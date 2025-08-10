from channels.generic.websocket import AsyncWebsocketConsumer
import json
import re

UUID_RE = re.compile(r"^[0-9a-fA-F-]{36}$")

class DeviceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.uuid = self.scope["url_route"]["kwargs"]["uuid"]
        if not UUID_RE.match(self.uuid):
            await self.close()
            return
        self.group_name = f"device-{self.uuid}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        # Optional: notify client it's connected
        await self.send(text_data=json.dumps({"type": "connected", "uuid": self.uuid}))

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Server-triggered event to instruct redirect
    async def redirect(self, event):
        url = event.get("url")
        await self.send(text_data=json.dumps({"type": "redirect", "url": url}))