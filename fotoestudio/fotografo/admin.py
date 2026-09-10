from django.contrib import admin
from .models import Producto, Paquete, DetallePaquete

class DetallePaqueteInline(admin.TabularInline):
    model = DetallePaquete
    extra = 1

@admin.register(Paquete)
class PaqueteAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'precio_paquete')
    inlines = [DetallePaqueteInline]

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'medida', 'precio', 'stock', 'creado_por')