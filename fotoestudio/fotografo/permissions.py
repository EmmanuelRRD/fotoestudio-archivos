class CitaViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        
        if user.is_staff:
            return Cita.objects.all()
        
        # El fotógrafo ve las que tiene ASIGNADAS, pero recuerda que el permiso 
        # anterior impedirá que las modifique aunque las vea. 
        if user.tipo_usuario == 'fotografo':
            return Cita.objects.filter(fotografo=user)
        
        # El cliente ve las que ÉL agendó
        return Cita.objects.filter(cliente=user)