from django.db import migrations, models
from django.core.validators import MaxValueValidator, MinValueValidator


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0029_preference_max_days_ahead_task_min_split_minutes"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="max_split_minutes",
            field=models.PositiveSmallIntegerField(
                blank=True,
                null=True,
                validators=[MinValueValidator(15), MaxValueValidator(1440)],
            ),
        ),
    ]
