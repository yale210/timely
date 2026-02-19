from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError
from core.models import Preference
from core.serializers.preference import PreferenceSerializer
from rest_framework.decorators import action
from rest_framework.response import Response

class PreferenceViewSet(viewsets.ModelViewSet):
    queryset = Preference.objects.none()
    serializer_class = PreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Preference.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        if Preference.objects.filter(user=self.request.user).exists():
            raise ValidationError("This user already has a set preference.")
        serializer.save()

    #Handles url requests without needing to create new url patterns in urls.py
    #Now available:
    #GET /api/preferences/me/
    #PATCH /api/preferences/me/
    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        pref, _ = Preference.objects.get_or_create(user=request.user)
        return Response(self.get_serializer(pref).data)
    
    @me.mapping.patch
    def me_path(self, request):
        pref, _ = Preference.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(pref, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)