import os
from firebase_admin import initialize_app
from firebase_functions import https_fn

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

from config.wsgi import application

initialize_app()

@https_fn.on_request()
def api(req):
    # The WSGI callable expects a different environment format than what Cloud Functions provides.
    # We also need a start_response callable, which we can ignore for this purpose.
    # This compatibility wrapper is necessary to host a WSGI app (like Django) on Cloud Functions.
    return application(req.environ, lambda status, headers: None)
