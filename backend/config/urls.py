from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),

    # App Routes
    path('api/core/', include('core.urls')),
    path('api/auth/', include('users.urls')),

    # Frontend Pages
    path('', TemplateView.as_view(template_name='home(desktop).html'), name='home'),
    path('login/', TemplateView.as_view(template_name='login(desktop).html'), name='login'),
    path('new_front/', TemplateView.as_view(template_name='index(desktop).html'), name='new_front'), # Testing purposes
    path('register/', TemplateView.as_view(template_name='register(desktop).html'), name='register'),
    path('profile/', TemplateView.as_view(template_name='profile(desktop).html'), name='profile_page'),
]