from loguru import logger
import sys

logger.remove()
logger.add(sys.stdout, format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{line} | {message}", level="INFO")
logger.add("storage/logs/campusiq.log", rotation="10 MB", retention="30 days", level="DEBUG")
