from rest_framework import serializers
from .models import Usuario
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.permissions import AllowAny #Para no pedir el token

class NewUser(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['username', 'password', 'email', 'first_name', 'last_name', 'tipo_usuario', 'sexo']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        tipo = validated_data.get('tipo_usuario', 'cliente')
        
        user = Usuario.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            tipo_usuario=tipo,
            sexo=validated_data.get('sexo', 'M')
        )
        
        if tipo == 'admin':# Si es de tipo admin => staff
            user.is_staff = True
            user.is_superuser = True
            user.save()
            
        return user

class LoginTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        
        nombre_completo = f"{user.first_name} {user.last_name}".strip()
        
        data['tipo_usuario'] = user.tipo_usuario
        data['is_staff'] = user.is_staff
        data['nombre_completo'] = nombre_completo if nombre_completo else "Usuario sin nombre"
        
        return data

class UsuarioListSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 
            'last_name', 'tipo_usuario', 'is_staff', 'is_active', 
            'password'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        usuario = super().create(validated_data)
        
        if password:
            usuario.set_password(password) # Encriptacion
            usuario.save()
        return usuario

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        usuario = super().update(instance, validated_data)
        
        if password:
            usuario.set_password(password)
            usuario.save()
        return usuario