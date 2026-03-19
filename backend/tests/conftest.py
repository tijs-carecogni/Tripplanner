import pytest


def pytest_collection_modifyitems(items):
    """Auto-mark all async test functions with asyncio."""
    for item in items:
        if item.get_closest_marker("asyncio") is None and "async" in str(type(item.obj)):
            item.add_marker(pytest.mark.asyncio)
