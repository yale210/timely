from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0026_preference_limit_max_hours"),
    ]

    operations = [
        migrations.AddField(
            model_name="preference",
            name="disable_sound_effects",
            field=models.BooleanField(default=False),
        ),
    ]
