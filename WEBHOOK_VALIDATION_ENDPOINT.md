### Webhook de Validación — Especificación del endpoint receptor

- Método: POST
- Header: `Content-Type: application/json`
- Codificación: UTF-8

El endpoint debe aceptar un cuerpo JSON con la siguiente estructura exacta:

- cert_no: string — Número de certificado.
- user: string — Email del usuario que tomó la decisión.
- timestamp: string — Fecha y hora en formato ISO 8601 (por ejemplo, `2025-01-30T12:34:56.789Z`).
- report_url: string — URL pública para consultar el reporte asociado.

Ejemplo de payload:

```json
{
  "cert_no": "ABC-123",
  "user": "usuario@empresa.com",
  "timestamp": "2025-08-24T12:34:56.789Z",
  "report_url": "https://certificate-report-339343666693.us-central1.run.app/certificates/ABC-123/view"
}
```

No se envían otras propiedades en el cuerpo. 


