from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token # <--- Built-in Login (for now)
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', obtain_auth_token, name='login'),
    path('profile/', views.ManageProfileView.as_view(), name='profile'),
]