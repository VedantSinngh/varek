from bson import ObjectId
from pydantic import BeforeValidator
from typing import Annotated

# Custom Pydantic validator that converts MongoDB ObjectId to str
PyObjectId = Annotated[str, BeforeValidator(str)]
