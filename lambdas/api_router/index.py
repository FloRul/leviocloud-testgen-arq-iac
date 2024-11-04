import os
import simplejson as json
import base64
import uuid
from typing import Dict, Any, List
import time
import boto3
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.logging import correlation_paths
from botocore.exceptions import ClientError

logger = Logger()
tracer = Tracer()
metrics = Metrics()
app = APIGatewayRestResolver()

s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")
metadata_table = dynamodb.Table(os.environ["METADATA_TABLE"])
sqs_client = boto3.client("sqs")
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
    logger.info(f"User ID from claims: {user_id}")
    if not app.current_event.body or not app.current_event.is_base64_encoded:
        return {"statusCode": 400, "body": json.dumps({"message": "Invalid request"})}

    # Decode base64 content
    file_content = base64.b64decode(app.current_event.body)

    # Check file size
    if len(file_content) > MAX_FILE_SIZE:
        return {"statusCode": 400, "body": json.dumps({"message": "File too large"})}

    content_type = app.current_event.headers.get(
        "content-type", "application/octet-stream"
    )
    filename = app.current_event.headers.get("filename", "unnamed-file")

    # Generate unique file_id
    file_id = str(uuid.uuid4())
    key = f"{user_id}/{file_id}"

    try:
        # Upload to S3
        s3_client.put_object(
            Bucket=BUCKET_NAME, Key=key, Body=file_content, ContentType=content_type
        )

        # Store metadata
        metadata = {
            "user_id": user_id,
            "file_id": file_id,
            "filename": filename,
            "content_type": content_type,
            "size": int(len(file_content)),
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


@app.delete("/files/<file_id>")
@tracer.capture_method
def delete_file(file_id: str):
    user_id = app.current_event.request_context.authorizer.claims.get("sub")

    try:
        # First, retrieve the metadata to get the S3 key
        response = metadata_table.get_item(Key={"user_id": user_id, "file_id": file_id})

        if "Item" not in response:
            return {
                "statusCode": 404,
                "body": json.dumps({"message": "File not found"}),
            }

        s3_key = response["Item"]["s3_key"]

        # Delete from S3
        s3_client.delete_object(Bucket=BUCKET_NAME, Key=s3_key)

        # Delete metadata
        metadata_table.delete_item(Key={"user_id": user_id, "file_id": file_id})

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "File deleted successfully"}),
        }
    except ClientError as e:
        logger.exception("Failed to delete file")
        raise FileStorageError("Failed to delete file")


def retrieve_files(user_id, file_list: List[str]):
    for file_id in file_list:
        try:
            response = metadata_table.get_item(
                Key={"user_id": user_id, "file_id": file_id}
            )
            yield response["Item"]
        except ClientError as e:
            logger.exception("Failed to retrieve file")
            raise FileStorageError("Failed to retrieve file")


@app.post("/jobs")
@tracer.capture_method
def create_batch_inference_job():
    job_id = str(uuid.uuid4())
    user_id = app.current_event.request_context.authorizer.claims.get("sub")

    # Validate request body
    try:
        if not app.current_event.body:
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Request body is required"}),
            }

        file_list = json.loads(app.current_event.body)

        if not isinstance(file_list, list):
            return {
                "statusCode": 400,
                "body": json.dumps(
                    {"message": "Request body must be a list of file IDs"}
                ),
            }

        if not file_list:
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "File list cannot be empty"}),
            }

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON format: {str(e)}")
        return {
            "statusCode": 400,
            "body": json.dumps({"message": "Invalid JSON format in request body"}),
        }

    # Retrieve files
    try:
        files = list(retrieve_files(user_id, file_list))

        if not files:
            return {
                "statusCode": 404,
                "body": json.dumps(
                    {"message": "None of the specified files were found"}
                ),
            }

    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        logger.error(f"DynamoDB error while retrieving files: {error_code}")

        if error_code == "ResourceNotFoundException":
            return {
                "statusCode": 404,
                "body": json.dumps({"message": "Files table not found"}),
            }
        elif error_code == "ProvisionedThroughputExceededException":
            return {
                "statusCode": 429,
                "body": json.dumps(
                    {"message": "Too many requests, please try again later"}
                ),
            }
        else:
            return {
                "statusCode": 500,
                "body": json.dumps({"message": "Failed to retrieve files"}),
            }
    except FileStorageError as e:
        logger.error(f"File storage error: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"message": f"Error retrieving files: {str(e)}"}),
        }

    # Send SQS message
    try:
        message_body = {
            "user_id": user_id,
            "job_id": job_id,
            "status": "PENDING",
            "input_files": files,
        }

        sqs_client.send_message(
            QueueUrl=os.environ["INFERENCE_QUEUE_URL"],
            MessageBody=json.dumps(message_body),
        )

    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        logger.error(f"SQS error: {error_code}")

        if error_code == "QueueDoesNotExist":
            return {
                "statusCode": 500,
                "body": json.dumps({"message": "Job queue not available"}),
            }
        elif error_code == "InvalidMessageContents":
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Invalid message format"}),
            }
        else:
            return {
                "statusCode": 500,
                "body": json.dumps({"message": "Failed to queue job"}),
            }

    # Write job to DynamoDB
    try:
        metadata_table.put_item(
            Item={
                "user_id": user_id,
                "job_id": job_id,
                "status": "PENDING",
                "input_files": files,
                "created_at": int(time.time()),
                "updated_at": int(time.time()),
            }
        )

    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        logger.error(f"DynamoDB error while creating job: {error_code}")

        if error_code == "ResourceNotFoundException":
            return {
                "statusCode": 500,
                "body": json.dumps({"message": "Jobs table not found"}),
            }
        elif error_code == "ProvisionedThroughputExceededException":
            return {
                "statusCode": 429,
                "body": json.dumps(
                    {"message": "Too many requests, please try again later"}
                ),
            }
        else:
            return {
                "statusCode": 500,
                "body": json.dumps({"message": "Failed to create job record"}),
            }

    # Success response
    return {
        "statusCode": 201,
        "body": json.dumps(
            {
                "message": "Job created successfully",
                "job_id": job_id,
                "status": "PENDING",
                "file_count": len(files),
            }
        ),
    }


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
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
