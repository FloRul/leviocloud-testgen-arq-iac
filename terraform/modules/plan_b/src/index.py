﻿import json
import os
import boto3
import re
from typing import Optional, Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.typing import LambdaContext
from aws_lambda_powertools.utilities.data_classes import (
    S3Event,
    event_source,
)
from botocore.config import Config
from botocore.exceptions import ClientError

# Initialize Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics()

# Get clients using utility function
s3_client = boto3.client("s3")
bedrock_client = boto3.client("bedrock-runtime")
sns_client = boto3.client("sns")


# Configuration
class Config:
    DEFAULT_MODEL = "anthropic.claude-3-sonnet-20240229-v1:0"
    DEFAULT_MAX_TOKENS = 4096
    DEFAULT_TEMPERATURE = 0.1
    INSTRUCTIONS = (
        "Génère ta réponse entre les balises suivantes : <reponse></reponse>, "
        "n'utilise aucune balise supplémentaire."
    )
    MAX_BEDROCK_CALL_AMOUNT = 7
    INPUT_BUCKET = os.environ["INPUT_BUCKET"]
    OUTPUT_BUCKET = os.environ["OUTPUT_BUCKET"]
    SNS_TOPIC_ARN = os.environ["SNS_TOPIC_ARN"]
    PRESIGNED_URL_EXPIRATION = 3600  # 1 hour in seconds


@tracer.capture_method
def generate_presigned_url(
    bucket: str, key: str, expiration: int = Config.PRESIGNED_URL_EXPIRATION
) -> str:
    """Generate a presigned URL for an S3 object."""
    try:
        url = s3_client.generate_presigned_url(
            "get_object", Params={"Bucket": bucket, "Key": key}, ExpiresIn=expiration
        )
        return url
    except Exception as e:
        logger.exception(f"Error generating presigned URL: {str(e)}")
        raise


@tracer.capture_method
def send_sns_notification(file_info: Dict[str, Any], presigned_url: str) -> None:
    """Send SNS notification with file processing results and presigned URL."""
    try:
        message = {
            "status": file_info["status"],
            "fileName": file_info["fileName"],
            "responseKey": file_info.get("responseKey"),
            "downloadUrl": presigned_url,
            "expiresIn": f"{Config.PRESIGNED_URL_EXPIRATION} seconds",
            "message": "File processing complete",
        }

        if file_info.get("error"):
            message["error"] = file_info["error"]

        sns_client.publish(
            TopicArn=Config.SNS_TOPIC_ARN,
            Message=json.dumps(message),
            Subject=f"File Processing {file_info['status'].title()}: {file_info['fileName']}",
        )

        metrics.add_metric(name="SNSNotificationsSent", unit=MetricUnit.Count, value=1)

    except Exception as e:
        logger.exception(f"Error sending SNS notification: {str(e)}")
        metrics.add_metric(name="SNSNotificationErrors", unit=MetricUnit.Count, value=1)
        raise


@tracer.capture_method
def extract_formatted_response(text: str) -> Optional[str]:
    """Extract content between <reponse> tags."""
    if not text:
        logger.warning("Empty text provided for response extraction")
        return None

    matches = re.finditer(r"<reponse>([\s\S]*?)</reponse>", text, re.IGNORECASE)
    responses = [match.group(1).strip() for match in matches]

    if not responses:
        logger.warning("No response tags found in text")
        return None

    if len(responses) > 1:
        logger.warning(f"Found {len(responses)} response tags - concatenating content")
        responses = [r for r in responses if r]
        return " ".join(responses)

    content = responses[0]

    if "<reponse>" in content or "</reponse>" in content:
        logger.warning("Possible nested or malformed tags detected in response")

    if not content:
        logger.warning("Empty response content detected")
        return None

    return content


@tracer.capture_method
def call_bedrock(
    system_prompt: str,
    user_input: str,
    model_id: str = Config.DEFAULT_MODEL,
    max_tokens: int = Config.DEFAULT_MAX_TOKENS,
    temperature: float = Config.DEFAULT_TEMPERATURE,
) -> str:
    """Call Bedrock API with the given parameters."""
    try:
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "temperature": temperature,
            "system": system_prompt,
            "messages": [
                {"role": "user", "content": [{"type": "text", "text": user_input}]}
            ],
        }

        metrics.add_metric(name="BedrockAPICall", unit=MetricUnit.Count, value=1)

        response = bedrock_client.invoke_model(
            modelId=model_id, body=json.dumps(request_body)
        )

        response_body = json.loads(response["body"].read())

        if not response_body.get("content", [{}])[0].get("text"):
            raise ValueError("Invalid response format from Bedrock")

        return response_body["content"][0]["text"]

    except Exception as e:
        logger.exception(f"Error calling Bedrock: {str(e)}")
        metrics.add_metric(name="BedrockAPIError", unit=MetricUnit.Count, value=1)
        raise


def extract_user_prompt(text: str) -> str:
    """Extract user prompt from the file content."""
    match = re.search(r"<prompt>([\s\S]*?)</prompt>", text, re.IGNORECASE)
    return match.group(1) if match else ""


@tracer.capture_method
def process_file(bucket: str, key: str) -> Dict[str, Any]:
    """Process a single file from S3."""
    try:
        # Get file from S3
        logger.info(f"Processing file: {key}")
        metrics.add_metric(name="FilesProcessed", unit=MetricUnit.Count, value=1)

        s3_response = s3_client.get_object(Bucket=bucket, Key=key)
        file_content = s3_response["Body"].read().decode("utf-8")

        user_prompt = extract_user_prompt(file_content)

        system_prompt = user_prompt + Config.INSTRUCTIONS

        output = file_content
        call_count = 0
        valid_response = False

        # Loop for Bedrock API calls
        while call_count < Config.MAX_BEDROCK_CALL_AMOUNT and not valid_response:
            with tracer.provider.in_subsegment("bedrock_call") as subsegment:
                logger.info(f"Bedrock API call attempt {call_count + 1}")
                subsegment.put_annotation("attempt", call_count + 1)

                bedrock_response = call_bedrock(
                    system_prompt,
                    output,
                    Config.DEFAULT_MODEL,
                )
                output += bedrock_response
                call_count += 1

                extracted_response = extract_formatted_response(output)
                if extracted_response:
                    valid_response = True
                    output = extracted_response

                logger.info(f"Bedrock API call attempt {call_count}")

        if not valid_response:
            logger.warning(
                f"Failed to get valid response for {key} after "
                f"{Config.MAX_BEDROCK_CALL_AMOUNT} attempts"
            )
            metrics.add_metric(name="FailedResponses", unit=MetricUnit.Count, value=1)

        # Store response in S3
        response_key = f"{key}-response.txt"
        s3_client.put_object(
            Bucket=Config.OUTPUT_BUCKET,
            Key=response_key,
            Body=("<prompt>" + user_prompt + "</prompt>\n" + output).encode("utf-8"),
        )

        # Generate presigned URL and send notification
        presigned_url = generate_presigned_url(Config.OUTPUT_BUCKET, response_key)

        result = {
            "fileName": key,
            "status": "success" if valid_response else "failed",
            "responseKey": response_key,
            "callCount": call_count,
        }

        send_sns_notification(result, presigned_url)

        return result

    except ClientError as e:
        logger.exception(f"AWS Error processing file {key}")
        metrics.add_metric(name="AWSErrors", unit=MetricUnit.Count, value=1)
        error_result = {
            "fileName": key,
            "status": "error",
            "error": f"AWS Error: {str(e)}",
        }
        send_sns_notification(error_result, "")
        return error_result

    except Exception as e:
        logger.exception(f"Error processing file {key}")
        metrics.add_metric(name="ProcessingErrors", unit=MetricUnit.Count, value=1)
        error_result = {
            "fileName": key,
            "status": "error",
            "error": str(e),
        }
        send_sns_notification(error_result, "")
        return error_result


@logger.inject_lambda_context(log_event=True)
@metrics.log_metrics(capture_cold_start_metric=True)
@tracer.capture_lambda_handler
@event_source(data_class=S3Event)
def lambda_handler(event: S3Event, context: LambdaContext) -> Dict[str, Any]:
    """Main Lambda handler function with Powertools decorators."""
    try:
        responses = []

        for record in event.records:
            response = process_file(event.bucket_name, record.s3.get_object.key)
            responses.append(response)

        failed_files = [r for r in responses if r["status"] == "error"]

        if failed_files:
            logger.warning(f"{len(failed_files)} files failed processing")
            return {
                "statusCode": 207,
                "body": json.dumps(
                    {"message": "Some files failed to process", "results": responses}
                ),
            }

        logger.info("All files processed successfully")
        return {
            "statusCode": 200,
            "body": json.dumps(
                {"message": "All files processed successfully", "results": responses}
            ),
        }

    except Exception as e:
        logger.exception("Handler error")
        metrics.add_metric(name="HandlerErrors", unit=MetricUnit.Count, value=1)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Internal server error", "message": str(e)}),
        }
