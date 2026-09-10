from rest_framework import serializers
from fotografo.models import Paquete
from login.models import Usuario
from .models import Cita

class PaqueteSerializer(serializers.ModelSerializer): # Mostrar los paquetes
    class Meta:
        model = Paquete
        fields = ['id', 'nombre','precio_paquete'] #Los datos que se quieren mostrar



class CitaSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.ReadOnlyField(source='cliente.get_full_name')    
    paquete_nombre = serializers.ReadOnlyField(source='paquete.nombre')    
    fotografo_nombre = serializers.ReadOnlyField(source='fotografo.get_full_name')

    class Meta:
        model = Cita
        fields = [
            'id', 
            'cliente', 'cliente_nombre', 
            'paquete', 'paquete_nombre', 
            'fotografo', 'fotografo_nombre',
            'precio_total', 'abono', 'pagado', 
            'fecha_cita', 'lugar', 'notas'
        ]

class FotografoSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'tipo_usuario']
        
class UsersSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'tipo_usuario']
        
class CitaUpdateSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.ReadOnlyField(source='cliente.get_full_name')    
    paquete_nombre = serializers.ReadOnlyField(source='paquete.nombre')    
    fotografo_nombre = serializers.ReadOnlyField(source='fotografo.get_full_name')
    
    class Meta:
        model = Cita
        fields = [
            'id', 
            'cliente', 'cliente_nombre', 
            'paquete', 'paquete_nombre', 
            'fotografo', 'fotografo_nombre',
            'precio_total', 'abono', 'pagado', 
            'fecha_cita', 'lugar', 'notas'
        ]

    def validate(self, data):
        nuevo_paquete = data.get('paquete')
        
        if self.instance and nuevo_paquete:
            precio_actual = self.instance.paquete.precio_paquete
            precio_nuevo = nuevo_paquete.precio_paquete

            if precio_nuevo < precio_actual:# Vemos que el nuevo paquete sea mejor que el anterior
                raise serializers.ValidationError({
                    "paquete": f"Solo se puede mejorar el paquete"
                               f"El actual cuesta ${precio_actual} y el nuevo ${precio_nuevo}."
                })
        
        return data

class AgendaCitasSerializer(serializers.ModelSerializer):
    nombre_fotografo = serializers.ReadOnlyField(source='fotografo.get_full_name')
    nombre_cliente = serializers.ReadOnlyField(source='cliente.get_full_name')
    
    class Meta:
        model = Cita
        fields = [
            'id', 
            'fecha_cita', 
            'nombre_fotografo', 
            'nombre_cliente', 
            'lugar'
        ]
        
