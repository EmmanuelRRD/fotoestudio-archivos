from django.contrib.auth import get_user_model
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Q  # búsquedas complejas
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
import os
import requests
from rest_framework.response import Response
from rest_framework import status

from .serializers import (
    LoginTokenSerializer,
    NewUser,
    UsuarioListSerializer,
)

User = get_user_model()

class UsuariosViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = UsuarioListSerializer

    def get_queryset(self):
        queryset = User.objects.all().order_by('-id')

        tipo_usuario = self.request.query_params.get('tipo_usuario', None)
        if tipo_usuario and tipo_usuario != 'todos':
            queryset = queryset.filter(tipo_usuario__iexact=tipo_usuario)

        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )

        return queryset

    def list(self, request, *args, **kwargs):
        page_number = request.query_params.get('page', 1)
        page_size = request.query_params.get('size', 5) 
        
        queryset_filtrado = self.get_queryset()
        paginator = Paginator(queryset_filtrado, page_size)
        
        try:
            page_obj = paginator.page(page_number)
        except PageNotAnInteger:
            page_obj = paginator.page(1)
        except EmptyPage:
            page_obj = paginator.page(paginator.num_pages)
            
        serializer = self.get_serializer(page_obj.object_list, many=True)
        
        return Response({
            'count': paginator.count,
            'total_pages': paginator.num_pages,
            'current_page': page_obj.number,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous(),
            'results': serializer.data
        }, status=status.HTTP_200_OK)
        
class NewUserView(APIView):
    permission_classes = [AllowAny] 

    def post(self, request):
        tipo_solicitado = request.data.get('tipo_usuario', 'cliente')
        
        if tipo_solicitado in ['admin', 'fotografo']:
            if not request.user.is_authenticated or not request.user.is_staff:
                return Response(
                    {"error": "No tienes permiso para crear usuarios de este tipo."},
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = NewUser(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Usuario creado con éxito"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = LoginTokenSerializer

    def post(self, request, *args, **kwargs):
        captcha_token = request.data.get('captcha_token')
        
        if not captcha_token:
            return Response(
                {"detail": "Por favor, completa el campo de verificación (Captcha)."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        SECRET_KEY_V2 = os.getenv('RECAPTCHA_SECRET_KEY')
        verify_url = "https://www.google.com/recaptcha/api/siteverify"

        payload = {
            'secret': SECRET_KEY_V2,
            'response': captcha_token
        }

        try:
            response = requests.post(verify_url, data=payload)
            result = response.json()
        except requests.exceptions.RequestException:
            return Response(
                {"detail": "No se pudo verificar el Captcha con los servidores de Google."}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        if not result.get('success'):
            return Response(
                {"detail": "Verificación de Captcha inválida o vencida. Inténtalo de nuevo."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().post(request, *args, **kwargs)

class UsuarioListView(APIView):
    permission_classes = [AllowAny] 

    def get(self, request):
        page_number = request.query_params.get('page', 1)
        page_size = request.query_params.get('size', 10) 
        
        usuarios_queryset = User.objects.all().order_by('-id') 
        
        paginator = Paginator(usuarios_queryset, page_size)
        
        try:
            page_obj = paginator.page(page_number)
        except PageNotAnInteger:
            page_obj = paginator.page(1)
        except EmptyPage:
            page_obj = paginator.page(paginator.num_pages)
            
        serializer = UsuarioListSerializer(page_obj.object_list, many=True)
        
        return Response({
            'count': paginator.count,
            'total_pages': paginator.num_pages,
            'current_page': page_obj.number,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous(),
            'results': serializer.data
        }, status=status.HTTP_200_OK)