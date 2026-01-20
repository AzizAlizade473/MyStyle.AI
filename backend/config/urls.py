from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),

    # App Routes
    path('api/core/', include('core.urls')),
    path('api/auth/', include('users.urls')),

    # Frontend Pages
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('login/', TemplateView.as_view(template_name='login.html'), name='login'),

    path('register/', TemplateView.as_view(template_name='register.html'), name='register'),
]