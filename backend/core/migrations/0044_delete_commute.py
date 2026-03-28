from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0043_delete_profile"),
    ]

    operations = [
        migrations.DeleteModel(
            name="Commute",
        ),
    ]
