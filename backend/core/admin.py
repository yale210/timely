from django.contrib import admin

from .models import Grade,Category

@admin.register(Category)  
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("text",)

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
	list_display = ("name", "user", "score", "total_possible", "date_achieved")
	search_fields = ("name", "user__username")
	list_filter = ("date_achieved", "category")

