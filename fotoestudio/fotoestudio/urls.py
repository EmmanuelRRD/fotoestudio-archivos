from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from cliente.views import CitaViewSet, PaqueteViewSet as PaqueteClienteViewSet, FotografoViewSet
from cliente.views import FotografosViewSet, ClienteViewSet
from login.views import NewUserView, LoginView, UsuarioListView, UsuariosViewSet
from django.conf import settings
from django.conf.urls.static import static
from django.http import Http404
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from fotografo.views import (
    ProductoViewSet, 
    PaqueteViewSet as PaqueteGestionViewSet,      
    DetallePaqueteViewSet as DetallesPaqueteViewSet,
    CalendarfoViewSet
)

router = routers.DefaultRouter()
router.register(r'citas', CitaViewSet, basename='cita')
router.register(r'paquetes-cliente', FotografoViewSet, basename='paquete-cliente')
router.register(r'fotografos', FotografoViewSet, basename='fotografo-listado')

router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'paquetes-fotografo', PaqueteGestionViewSet, basename='paquete-fotografo')
router.register(r'calendario-fotografos', CalendarfoViewSet, basename='calendario-fotografo')
router.register(r'detalles-paquete', DetallesPaqueteViewSet, basename='detalles-paquete')
router.register(r'fotografosds', FotografosViewSet, basename='fotografos-ds')
router.register(r'clientesds', ClienteViewSet, basename='clientes-ds')

router.register(r'usuarios', UsuariosViewSet, basename='usuarios')

def root_not_found(request):
    raise Http404("La raíz del servidor no está disponible de manera pública.")

urlpatterns = [
    path('', root_not_found, name='root_404'),
    path('admin/', admin.site.urls),
    #Endpoints del API
    path('api/', include(router.urls)),
    path('registro/', NewUserView.as_view(), name='registro'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),# Renueva el token
    path('login/', LoginView.as_view(), name='token_obtain_pair'),# Genera el token
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)