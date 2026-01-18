from django.db import migrations
from pgvector.django import VectorExtension

class Migration(migrations.Migration):

    dependencies = [
        # Leave this list as it is (it might be empty or have dependencies)
    ]

    operations = [
        VectorExtension()
    ]