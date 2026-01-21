from django.db import models

# Tasks: USERID, Task ID, estimated time, complete (bool), deadline, SHOULD BE ITS OWN MODEL:(task category), notes (string), priority, subtasks (maps one-to-many to other task IDs),
# Task category: have unique categories so the db does not store the same thing thousands of times  (ie school)


class Category(models.Model):
    text = models.CharField(max_length=20, unique=True, blank=False, null=False)

    # Return category.
    def __str__(self):
        return self.text
