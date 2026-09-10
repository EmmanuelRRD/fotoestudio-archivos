from django.contrib import admin
from .models import Cita

@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    list_display = ('id', 'cliente', 'paquete', 'precio_total', 'abono', 'pagado', 'fecha_cita')
    list_filter = ('pagado', 'fecha_cita')
    search_fields = ('cliente__username', 'paquete__nombre')