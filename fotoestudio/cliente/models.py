from django.db import models
from django.conf import settings
from fotografo.models import Paquete

class Cita(models.Model):
    # Cliente
    cliente = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='citas_cliente' # Cambiamos esto para evitar conflictos
    )
    
    fotografo = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='citas_asignadas',
        limit_choices_to={'tipo_usuario': 'fotografo'} # Esto ayuda en el Admin
    )
    
    paquete = models.ForeignKey(
        Paquete, 
        on_delete=models.PROTECT,
        related_name='citas'
    )
    
    precio_total = models.DecimalField(max_digits=10, decimal_places=2)
    abono = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    pagado = models.BooleanField(default=False)
    fecha_cita = models.DateTimeField()
    lugar = models.CharField(max_length=255, default='Estudio Jerez')
    notas = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Cita {self.id} - {self.cliente.username} ({self.fecha_cita.date()})"

    def save(self, *args, **kwargs):
        if not self.precio_total and self.paquete:
            self.precio_total = getattr(self.paquete, 'precio', 0)
            
        if self.abono >= self.precio_total:
            self.pagado = True
        else:
            self.pagado = False
            
        super().save(*args, **kwargs)