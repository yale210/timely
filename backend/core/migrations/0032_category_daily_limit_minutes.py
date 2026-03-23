from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models


def convert_hours_to_minutes(apps, schema_editor):
    Category = apps.get_model("core", "Category")
    for category in Category.objects.exclude(max_daily_study_time__isnull=True):
        category.max_daily_study_time = category.max_daily_study_time * 60
        category.save(update_fields=["max_daily_study_time"])


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0031_preference_drag_snap_minutes"),
    ]

    operations = [
        migrations.RunPython(convert_hours_to_minutes, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="category",
            name="max_daily_study_time",
            field=models.PositiveSmallIntegerField(
                blank=True,
                null=True,
                validators=[MinValueValidator(0), MaxValueValidator(1440)],
            ),
        ),
    ]
