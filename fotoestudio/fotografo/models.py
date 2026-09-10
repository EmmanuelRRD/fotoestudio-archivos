from django.db import models

class Producto(models.Model):
    nombre = models.CharField(max_length=100)
    medida = models.CharField(max_length=50) 
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    creado_por = models.ForeignKey('login.Usuario', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.nombre} ({self.medida})"
    
class Paquete(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    precio_paquete = models.DecimalField(max_digits=10, decimal_places=2)
    productos = models.ManyToManyField(Producto, through='DetallePaquete')
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

class DetallePaquete(models.Model):
    paquete = models.ForeignKey(Paquete, on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.cantidad} x {self.producto.nombre} en {self.paquete.nombre}"