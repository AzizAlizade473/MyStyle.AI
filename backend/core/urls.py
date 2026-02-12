from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.ImageUploadView.as_view(), name='image-upload'),
    path('search/', views.search_images, name='image-search'),
    path('style-image-search/', views.style_image_search, name='style-image-search'),
]