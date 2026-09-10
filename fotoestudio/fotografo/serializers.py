from rest_framework import serializers
from .models import Producto, Paquete, DetallePaquete
from login.models import Usuario
from cliente.models import Cita

class ProductoSerializer(serializers.ModelSerializer):
    creado_por = serializers.ReadOnlyField(source='creado_por.username')

    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'medida', 'precio', 'stock', 'creado_por']

class DetallePaqueteSerializer(serializers.ModelSerializer):
    producto_info = ProductoSerializer(source='producto', read_only=True)
    
    class Meta:
        model = DetallePaquete
        fields = ['producto_info', 'cantidad']
        
class DetallePaqueteEspecifcoSerializer(serializers.ModelSerializer):
    producto_info = ProductoSerializer(source='producto', read_only=True)
    
    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(), source='producto', write_only=True
    )

    class Meta:
        model = DetallePaquete
        fields = ['id', 'paquete', 'producto_id', 'producto_info', 'cantidad']

class PaqueteSerializer(serializers.ModelSerializer):
    contenido = DetallePaqueteSerializer(source='detallepaquete_set', many=True, read_only=True)
    
    class Meta:
        model = Paquete
        fields = ['id', 'nombre', 'descripcion', 'precio_paquete', 'contenido']
        
class AgendaFotografoSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.ReadOnlyField(source='cliente.get_full_name')
    paquete_nombre = serializers.ReadOnlyField(source='paquete.nombre')
    
    class Meta:
        model = Cita
        fields = [
            'id', 'cliente', 'cliente_nombre', 'paquete', 'paquete_nombre', 
            'fotografo', 'fecha_cita', 'lugar', 'notas', 'precio_total', 'pagado'
        ]
        
