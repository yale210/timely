from django.db import models

#User: Username, User ID, FirstName, LastName, DOB, Email, DO NOT NEED INSIDE USER: Events, Tasks, Preferences

class User(models.Model):
    username=models.CharField(max_length=15)
    first_name=models.CharField(max_length=50,null=True,blank=True)
    last_name=models.CharField(max_length=50,null=True,blank=True)
    date_of_birth=models.DateField(null=True,blank=True)
    email=models.CharField(max_length=254,null=True,blank=True)

    # Return username.
    def __str__(self):
        return self.username