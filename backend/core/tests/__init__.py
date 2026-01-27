from pathlib import Path


def load_tests(loader, tests, pattern):
    package_dir = Path(__file__).resolve().parent
    return loader.discover(str(package_dir), pattern or "test*.py")
