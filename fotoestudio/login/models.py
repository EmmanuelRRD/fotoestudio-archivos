from django.db import models
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    TIPOS_USUARIO = [
        ('admin', 'Administrador'),
        ('fotografo', 'Fotógrafo'),
        ('cliente', 'Cliente'),
    ]
    
    SEXO_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Femenino'),
        ('O', 'Otro'),
        ('N', 'Prefiero no decirlo'),
    ]

    tipo_usuario = models.CharField(
        max_length=20, 
        choices=TIPOS_USUARIO, 
        default='cliente'
    )
    
    email = models.EmailField(unique=True)

    # Permitimos null y blank para que el comando createsuperuser no truene
    fecha_nacimiento = models.DateField(null=True, blank=True) 
    
    sexo = models.CharField(
        max_length=1, 
        choices=SEXO_CHOICES, 
        default='N',
        null=True, 
        blank=True
    )

    def __str__(self):
        return f"{self.username} ({self.tipo_usuario})"