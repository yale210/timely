from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0032_category_daily_limit_minutes"),
    ]

    operations = [
        migrations.AddField(
            model_name="event",
            name="buffer_after_minutes",
            field=models.PositiveSmallIntegerField(
                default=0,
                validators=[
                    django.core.validators.MinValueValidator(0),
                    django.core.validators.MaxValueValidator(240),
                ],
            ),
        ),
        migrations.AddField(
            model_name="event",
            name="buffer_before_minutes",
            field=models.PositiveSmallIntegerField(
                default=0,
                validators=[
                    django.core.validators.MinValueValidator(0),
                    django.core.validators.MaxValueValidator(240),
                ],
            ),
        ),
        migrations.AddField(
            model_name="task",
            name="buffer_after_minutes",
            field=models.PositiveSmallIntegerField(
                default=0,
                validators=[
                    django.core.validators.MinValueValidator(0),
                    django.core.validators.MaxValueValidator(240),
                ],
            ),
        ),
        migrations.AddField(
            model_name="task",
            name="buffer_before_minutes",
            field=models.PositiveSmallIntegerField(
                default=0,
                validators=[
                    django.core.validators.MinValueValidator(0),
                    django.core.validators.MaxValueValidator(240),
                ],
            ),
        ),
    ]
