from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("send/", views.send_view, name="send"),
    path("receive/", views.receive_view, name="receive"),
    path("api/send/", views.api_send, name="api_send"),
]