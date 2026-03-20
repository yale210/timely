from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0022_task_locked"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="allow_split",
            field=models.BooleanField(default=False),
        ),
    ]
