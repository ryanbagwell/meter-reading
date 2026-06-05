from django.contrib import admin
from django.urls import path
from django.views.generic import RedirectView
from api.api import api_instance

urlpatterns = [
    path("", RedirectView.as_view(url="/api/docs")),
    path("admin/", admin.site.urls),
    path("api/", api_instance.urls),
]
