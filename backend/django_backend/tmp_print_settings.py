import importlib.util, pathlib
p = pathlib.Path('backend_django/settings.py').resolve()
spec = importlib.util.spec_from_file_location('local_settings', str(p))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
print('DEBUG=', getattr(mod,'DEBUG',None))
print('DATABASES=', getattr(mod,'DATABASES',None))
