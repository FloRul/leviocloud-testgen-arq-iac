import json
import os
import time
import boto3
import re
from typing import List, Optional, Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.batch import (
    BatchProcessor,
    EventType,
    process_partial_response,
)
from aws_lambda_powertools.utilities.data_classes.sqs_event import SQSRecord
from aws_lambda_powertools.utilities.typing import LambdaContext

processor = BatchProcessor(event_type=EventType.SQS)
from botocore.config import Config
from botocore.exceptions import ClientError

# Initialize Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics()

# Get clients using utility function
config = Config(read_timeout=1000)
s3_client = boto3.client("s3")
bedrock_client = boto3.client("bedrock-runtime", config=config)
dynamodb = boto3.resource("dynamodb")
job_table = dynamodb.Table(os.environ["INFERENCE_JOBS_TABLE"])


# Configuration
class Config:
    DEFAULT_MODEL = "anthropic.claude-3-sonnet-20240229-v1:0"
    DEFAULT_MAX_TOKENS = 4096
    DEFAULT_TEMPERATURE = 0.6
    INSTRUCTIONS = (
        "\nGénère ta réponse entre les balises suivantes : <reponse></reponse>, "
        "n'utilise aucune balise supplémentaire.\n"
    )
    MAX_BEDROCK_CALL_AMOUNT = 6
    INPUT_BUCKET = os.environ["INPUT_BUCKET"]
    OUTPUT_BUCKET = os.environ["OUTPUT_BUCKET"]


@tracer.capture_method
def extract_ai_response(messages: List[Dict[str, Any]]) -> Optional[str]:
    """Extract AI response from the response messages."""
    concat_output = ""
    for message in messages:
        if message["role"] != "assistant":
            continue

        content = message.get("content")
        if not isinstance(content, list) or len(content) == 0:
            logger.warning(
                f"Invalid message format: {message} - skipping response extraction"
            )
            continue

        text = content[0].get("text")
        if not isinstance(text, str):
            logger.warning(
                f"Invalid message format: {message} - skipping response extraction"
            )
            continue

        concat_output += text

    if not concat_output:
        logger.warning("No response found in messages")
        return None

    return concat_output


@tracer.capture_method
def call_bedrock(
    system_prompt: str,
    messages: List[Dict[str, Any]],
    model_id: str = Config.DEFAULT_MODEL,
    max_tokens: int = Config.DEFAULT_MAX_TOKENS,
    temperature: float = Config.DEFAULT_TEMPERATURE,
) -> str:
    """Call Bedrock API with the given parameters."""
    try:
        metrics.add_metric(name="BedrockAPICall", unit=MetricUnit.Count, value=1)

        response = bedrock_client.converse(
            modelId=model_id,
            messages=messages,
            system=system_prompt,
            inferenceConfig={"maxTokens": max_tokens, "temperature": temperature},
        )

        output_message = response["output"]["message"]
        total_tokens = response["usage"]["totalTokens"]
        return output_message, total_tokens

    except ClientError as e:
        logger.exception(f"Error calling Bedrock: {str(e)}")
        metrics.add_metric(name="BedrockError", unit=MetricUnit.Count, value=1)
        raise


@tracer.capture_method
def process_file(
    file_content: str, user_prompt: str, job_id: str, file_id: str, user_id: str
) -> Dict[str, Any]:
    """Process a single file content."""

    system_prompt = user_prompt + Config.INSTRUCTIONS
    messages = [
        {"role": "user", "content": [{"type": "text", "text": file_content}]},
    ]
    should_continue = True
    total_token = 0

    # Loop for Bedrock API calls
    while should_continue:
        with tracer.provider.in_subsegment("bedrock_call") as subsegment:
            logger.info(f"Bedrock API call attempt {call_count + 1}")
            subsegment.put_annotation("attempt", call_count + 1)

            bedrock_response, total_token = call_bedrock(
                system_prompt=system_prompt,
                messages=messages,
                model_id=Config.DEFAULT_MODEL,
                max_tokens=Config.DEFAULT_MAX_TOKENS,
                temperature=Config.DEFAULT_TEMPERATURE,
            )
            call_count += 1

            total_token = bedrock_response

            should_continue = (
                ("</reponse>" not in bedrock_response)
                and (call_count < Config.MAX_BEDROCK_CALL_AMOUNT)
                and (total_token < Config.DEFAULT_MAX_TOKENS)
            )

            if should_continue:
                messages.append(bedrock_response)
                messages.append(
                    {"role": "user", "content": [{"type": "text", "text": "continue"}]}
                )

    extracted_response = extract_ai_response(messages)
    logger.info(f"Bedrock API call attempt {call_count}")

    # Store response in S3
    result_key = f"{user_id}/{job_id}/{file_id}_result.txt"
    s3_client.put_object(
        Bucket=Config.OUTPUT_BUCKET,
        Key=result_key,
        Body=(extracted_response).encode("utf-8"),
    )


@tracer.capture_method
def record_handler(record: SQSRecord):
    payload = record.json_body
    logger.info(payload)
    job_id = payload.get("job_id")
    user_id = payload.get("user_id")
    job_table.update_item(
        Key={"user_id": user_id, "job_id": job_id},
        UpdateExpression="SET job_status=:s, updated_at=:u",
        ExpressionAttributeValues={
            ":s": "PROCESSING",
            ":u": int(time.time()),
        },
    )
    try:
        # extract file ids list
        file_keys = [file["file_id"] for file in payload["input_files"]]
        logger.info(
            f"Received job {job_id} for user {user_id}, processing files: {file_keys}"
        )
        # extract prompt
        prompt = payload["prompt"]

        # retrieve files
        for file_id in file_keys:
            file_content = (
                s3_client.get_object(
                    Bucket=Config.INPUT_BUCKET, Key=f"{user_id}/{file_id}"
                )["Body"]
                .read()
                .decode("utf-8")
            )
            logger.info(f"Processing file {file_id}")
            process_file(
                file_content=file_content,
                user_prompt=prompt,
                job_id=job_id,
                file_id=file_id,
                user_id=user_id,
            )

        job_table.update_item(
            Key={"user_id": user_id, "job_id": job_id},
            UpdateExpression="SET job_status=:s, updated_at=:u",
            ExpressionAttributeValues={
                ":s": "COMPLETED",
                ":u": int(time.time()),
            },
        )
    except Exception as e:
        logger.error(f"Error processing job {job_id}: {str(e)}")
        job_table.update_item(
            Key={"user_id": user_id, "job_id": job_id},
            UpdateExpression="SET job_status=:s, job_error=:e, updated_at=:u",
            ExpressionAttributeValues={
                ":s": "ERROR",
                ":e": str(e),
                ":u": int(time.time()),
            },
        )


@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event, context: LambdaContext):
    return process_partial_response(
        event=event,
        record_handler=record_handler,
        processor=processor,
        context=context,
    )
