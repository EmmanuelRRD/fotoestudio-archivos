from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Admin con su ABCC
        if request.user.is_staff:
            return True
            
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.cliente == request.user