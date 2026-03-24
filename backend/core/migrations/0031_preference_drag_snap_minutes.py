from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0030_task_max_split_minutes"),
    ]

    operations = [
        migrations.AddField(
            model_name="preference",
            name="drag_snap_minutes",
            field=models.PositiveSmallIntegerField(default=5),
        ),
    ]
