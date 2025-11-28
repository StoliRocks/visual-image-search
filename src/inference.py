"""SageMaker inference handlers for image feature extraction using ResNet101.

This module provides input/output handlers for TensorFlow Serving with SageMaker,
processing images through a ResNet101 model for feature extraction.
"""

from __future__ import annotations

import io
import json
from typing import TYPE_CHECKING, Any, NamedTuple

import numpy as np
from PIL import Image

if TYPE_CHECKING:
    from collections.abc import Callable

# TensorFlow imports with proper error handling
try:
    import tensorflow as tf
    from tensorflow.keras.applications.resnet import preprocess_input
    from tensorflow.keras.preprocessing import image as keras_image
except ImportError as e:
    raise ImportError(
        "TensorFlow is required. Install with: pip install tensorflow>=2.15.0"
    ) from e

# Image dimensions for ResNet101 input
HEIGHT: int = 224
WIDTH: int = 224


class Context(NamedTuple):
    """Request context for SageMaker inference.

    Attributes:
        model_name: Name of the model being served
        model_version: Version of the model
        method: HTTP method of the request
        rest_uri: REST API URI
        grpc_uri: gRPC URI if applicable
        custom_attributes: Custom request attributes
        request_content_type: Content type of the request
        accept_header: Accept header from the request
    """
    model_name: str
    model_version: str
    method: str
    rest_uri: str
    grpc_uri: str
    custom_attributes: str
    request_content_type: str
    accept_header: str


class InferenceError(Exception):
    """Custom exception for inference processing errors."""

    def __init__(self, code: int, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(f"Error {code}: {message}")


def preprocess_image(image_bytes: io.BytesIO) -> np.ndarray:
    """Preprocess an image for ResNet101 inference.

    Args:
        image_bytes: Image data as a BytesIO object

    Returns:
        Preprocessed image array ready for model inference

    Raises:
        ValueError: If the image cannot be processed
    """
    try:
        img = Image.open(image_bytes)

        # Convert to RGB if necessary (handles RGBA, grayscale, etc.)
        if img.mode != "RGB":
            img = img.convert("RGB")

        img = img.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)

        # Convert PIL image to numpy array
        img_array = keras_image.img_to_array(img, data_format="channels_first")

        # Expand dimensions: (3, 224, 224) -> (1, 3, 224, 224)
        expanded_img_array = np.expand_dims(img_array, axis=0)

        # Apply ResNet preprocessing
        preprocessed_img = preprocess_input(
            expanded_img_array,
            data_format="channels_first"
        )

        return preprocessed_img

    except Exception as e:
        raise ValueError(f"Failed to preprocess image: {e}") from e


def input_handler(data: Any, context: Context) -> str:
    """Pre-process request input before sending to TensorFlow Serving REST API.

    Args:
        data: The request data stream
        context: Context object containing request and configuration details

    Returns:
        JSON-serialized dict containing the preprocessed image data

    Raises:
        InferenceError: If the content type is unsupported
    """
    supported_content_types = {"application/x-image", "image/jpeg", "image/png"}

    if context.request_content_type not in supported_content_types:
        raise InferenceError(
            415,
            f'Unsupported content type "{context.request_content_type or "Unknown"}". '
            f"Supported types: {', '.join(supported_content_types)}"
        )

    image_bytes = io.BytesIO(data.read())
    preprocessed_img = preprocess_image(image_bytes)

    return json.dumps({"instances": preprocessed_img.tolist()})


def output_handler(data: Any, context: Context) -> tuple[bytes, str]:
    """Post-process TensorFlow Serving output before returning to client.

    Args:
        data: The TensorFlow Serving response
        context: Context object containing request and configuration details

    Returns:
        Tuple of (response data bytes, response content type)

    Raises:
        ValueError: If the model returned an error response
    """
    if data.status_code != 200:
        error_message = data.content.decode("utf-8")
        raise ValueError(f"Model inference failed: {error_message}")

    return data.content, context.accept_header
