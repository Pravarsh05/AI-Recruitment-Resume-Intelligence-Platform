from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first to get standard response
    response = exception_handler(exc, context)

    if response is not None:
        error_code = exc.__class__.__name__
        fields = {}
        message = "An error occurred."

        if isinstance(response.data, dict):
            if 'detail' in response.data:
                message = str(response.data['detail'])
                fields = None
            else:
                message = "Validation failed."
                fields = response.data
        elif isinstance(response.data, list):
            message = "; ".join([str(item) for item in response.data])
            fields = None

        custom_data = {
            "error": {
                "code": error_code,
                "message": message,
                "fields": fields
            }
        }
        response.data = custom_data

    return response
