from django.db import models
from django.utils.timezone import now
from .user import User
from .task_category import TaskCategory
from datetime import date
from django.core.validators import MinValueValidator, MaxValueValidator

#Tasks: USERID, Task ID, estimated time, complete (bool), deadline, SHOULD BE ITS OWN MODEL:(task category), notes (string), priority, subtasks (maps one-to-many to other task IDs),
#Task category: have unique categories so the db does not store the same thing thousands of times  (ie school)

class Task(models.Model):
    user = models.ForeignKey(User,on_delete = models.CASCADE, related_name='tasks')
    task_message = models.CharField(max_length=500)
    task_category = models.ForeignKey(TaskCategory,on_delete=models.CASCADE)

    estimated_time = models.PositiveSmallIntegerField()
    start_time = models.DateField()
    completed = models.BooleanField()
    deadline = models.DateField()

    # Query db for models with specific parent tasks when necessary.
    parent_task = models.ForeignKey("self",on_delete=models.CASCADE,null=True,blank=True)

    # 1 least important, 10 insanely urgent
    importance = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(10)
        ]
    )
    recurring = models.BooleanField(default=False)
    recurring_start = models.DateField()
    recurring_end = models.DateField()

    def calculateTimeLeft(self):
        current_time = now().date()
        
        if self.recurring and self.recurring_end:
            return (self.recurring_end-today).days
        
        if self.deadline:
            return (self.deadline-today).days

        return 0