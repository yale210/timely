from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("profiles", "0002_profile_avatar_upload"),
    ]

    operations = [
        migrations.DeleteModel(
            name="Preference",
        ),
    ]
