from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0020_category_colour_override"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="colour",
            field=models.CharField(blank=True, max_length=7, null=True),
        ),
        migrations.AddField(
            model_name="event",
            name="colour",
            field=models.CharField(blank=True, max_length=7, null=True),
        ),
        migrations.AddField(
            model_name="eventoverride",
            name="colour",
            field=models.CharField(blank=True, max_length=7, null=True),
        ),
    ]
