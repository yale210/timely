from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0034_remove_event_buffer_after_minutes_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="completed_minutes",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
