from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0024_special_dates_text_optional"),
    ]

    operations = [
        migrations.AddField(
            model_name="preference",
            name="day_schedule",
            field=models.JSONField(
                default=[
                    {"day": 1, "start": "08:00", "end": "22:00"},
                    {"day": 2, "start": "08:00", "end": "22:00"},
                    {"day": 3, "start": "08:00", "end": "22:00"},
                    {"day": 4, "start": "08:00", "end": "22:00"},
                    {"day": 5, "start": "08:00", "end": "22:00"},
                    {"day": 6, "start": "08:00", "end": "22:00"},
                    {"day": 7, "start": "08:00", "end": "22:00"},
                ]
            ),
        ),
    ]
