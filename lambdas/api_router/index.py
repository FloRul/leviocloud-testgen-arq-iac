﻿import os
import json
import base64
from typing import Dict, Any

import boto3
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.data_classes import APIGatewayProxyEvent
from botocore.exceptions import ClientError

logger = Logger()
tracer = Tracer()
metrics = Metrics()
app = APIGatewayRestResolver()

s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")
metadata_table = dynamodb.Table(os.environ["METADATA_TABLE"])
BUCKET_NAME = os.environ["BUCKET_NAME"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


class FileStorageError(Exception):
    pass


@app.get("/files")
@tracer.capture_method
def list_files():
    user_id = app.current_event.request_context.authorizer.claims.get("sub")

    try:
        response = metadata_table.query(
            KeyConditionExpression="user_id = :uid",
            ExpressionAttributeValues={":uid": user_id},
        )

        return {"statusCode": 200, "body": json.dumps(response.get("Items", []))}
    except ClientError as e:
        logger.exception("Failed to list files")
        raise FileStorageError("Failed to list files")


@app.post("/files")
@tracer.capture_method
def upload_file():
    user_id = app.current_event.request_context.authorizer.claims.get("sub")
    event_body = app.current_event.body

    if not event_body or not app.current_event.is_base64_encoded:
        return {"statusCode": 400, "body": json.dumps({"message": "Invalid request"})}

    # Decode base64 content
    file_content = base64.b64decode(event_body)

    # Check file size
    if len(file_content) > MAX_FILE_SIZE:
        return {"statusCode": 400, "body": json.dumps({"message": "File too large"})}

    content_type = app.current_event.headers.get(
        "content-type", "application/octet-stream"
    )
    filename = app.current_event.headers.get("filename", "unnamed-file")
    key = f"{user_id}/{filename}"

    try:
        # Upload to S3
        s3_client.put_object(
            Bucket=BUCKET_NAME, Key=key, Body=file_content, ContentType=content_type
        )

        # Store metadata
        metadata = {
            "user_id": user_id,
            "filename": filename,
            "content_type": content_type,
            "size": len(file_content),
            "s3_key": key,
        }

        metadata_table.put_item(Item=metadata)

        return {
            "statusCode": 200,
            "body": json.dumps(
                {"message": "File uploaded successfully", "metadata": metadata}
            ),
        }
    except ClientError as e:
        logger.exception("Failed to upload file")
        raise FileStorageError("Failed to upload file")


@app.delete("/files/<filename>")
@tracer.capture_method
def delete_file(filename: str):
    user_id = app.current_event.request_context.authorizer.claims.get("sub")
    key = f"{user_id}/{filename}"

    try:
        # Delete from S3
        s3_client.delete_object(Bucket=BUCKET_NAME, Key=key)

        # Delete metadata
        metadata_table.delete_item(Key={"user_id": user_id, "filename": filename})

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "File deleted successfully"}),
        }
    except ClientError as e:
        logger.exception("Failed to delete file")
        raise FileStorageError("Failed to delete file")


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    try:
        return app.resolve(event, context)
    except FileStorageError as e:
        logger.exception("File storage operation failed")
        return {"statusCode": 500, "body": json.dumps({"message": str(e)})}
    except Exception as e:
        logger.exception("Unknown error occurred")
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Internal server error"}),
        }