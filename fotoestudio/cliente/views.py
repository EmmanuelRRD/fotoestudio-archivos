from rest_framework import viewsets, filters
from .permissions import IsOwnerOrReadOnly
from rest_framework.permissions import IsAuthenticated
from .models import Cita
from fotografo.models import Paquete
from login.models import Usuario
from .serializers import CitaSerializer, PaqueteSerializer, FotografoSerializer, AgendaCitasSerializer, CitaUpdateSerializer, UsersSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

class PaginacionEstandar(PageNumberPagination):
    page_size = 6 # Muestra 5 citas por página
    page_size_query_param = 'page_size'
    max_page_size = 100
    
class PaginacionCitas(PageNumberPagination):
    page_size = 3 # Muestra 5 citas por página
    page_size_query_param = 'page_size'
    max_page_size = 100

class CitaViewSet(viewsets.ModelViewSet):
    queryset = Cita.objects.all()
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    
    pagination_class = PaginacionCitas
    filter_backends = [filters.SearchFilter]
    search_fields = ['lugar', 'notas', 'cliente__username', 'paquete__nombre']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Cita.objects.all().order_by('-id')
        if user.tipo_usuario == 'fotografo':
            return Cita.objects.filter(fotografo=user).order_by('-id')
        return Cita.objects.filter(cliente=user).order_by('-id')
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return CitaUpdateSerializer
        return CitaSerializer

    def perform_create(self, serializer):
        user = self.request.user
        
        if user.is_staff:
            serializer.save()
        else:
            serializer.save(cliente=user)
    
    @action(detail=False, methods=['get'])
    def agenda(self, request):
        from django.utils import timezone
        citas = Cita.objects.filter(fecha_cita__gte=timezone.now()).order_by('fecha_cita')
        
        page = self.paginate_queryset(citas)
        if page is not None:
            serializer = AgendaCitasSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = AgendaCitasSerializer(citas, many=True)
        return Response(serializer.data)
    
class PaqueteViewSet(viewsets.ReadOnlyModelViewSet): 
    queryset = Paquete.objects.all()
    serializer_class = PaqueteSerializer
    
class FotografoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Usuario.objects.filter(tipo_usuario='Fotógrafo') 
    serializer_class = FotografoSerializer
    pagination_class = PaginacionEstandar
    
class FotografosViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Usuario.objects.filter(tipo_usuario='Fotógrafo') 
    serializer_class = UsersSerializer
    
class ClienteViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Usuario.objects.filter(tipo_usuario='cliente') 
    serializer_class = FotografoSerializer