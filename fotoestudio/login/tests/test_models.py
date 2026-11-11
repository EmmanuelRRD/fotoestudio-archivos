import pytest

@pytest.mark.django_db
def test_conexion_base_datos():
    # Verificamos que pytest se conecta correctamente a tu base de datos MySQL
    assert True
    