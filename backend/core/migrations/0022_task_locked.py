from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0021_add_task_event_colour"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="locked",
            field=models.BooleanField(default=False),
        ),
    ]
