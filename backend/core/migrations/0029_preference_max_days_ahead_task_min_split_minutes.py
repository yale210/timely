from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0028_merge_20260311_1615"),
    ]

    operations = [
        migrations.AddField(
            model_name="preference",
            name="max_days_ahead",
            field=models.PositiveSmallIntegerField(
                default=30,
                validators=[
                    django.core.validators.MinValueValidator(1),
                    django.core.validators.MaxValueValidator(365),
                ],
            ),
        ),
        migrations.AddField(
            model_name="task",
            name="min_split_minutes",
            field=models.PositiveSmallIntegerField(
                default=30,
                validators=[
                    django.core.validators.MinValueValidator(15),
                    django.core.validators.MaxValueValidator(240),
                ],
            ),
        ),
    ]
