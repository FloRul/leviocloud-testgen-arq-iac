import json
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


# Configuration
class Config:
    DEFAULT_MODEL = "us.anthropic.claude-3-5-sonnet-20240620-v1:0"
    DEFAULT_MAX_TOKENS = 4096
    DEFAULT_TEMPERATURE = 0.1
    INSTRUCTIONS = (
        "Génère les tests du code source suivant."
        "Sois aussi exhaustif que possible.\n"
        "Génère ta réponse entre les balises suivantes : <reponse></reponse>, "
        "n'utilise aucune balise supplémentaire."
    )
    MAX_BEDROCK_CALL_AMOUNT = 7
    INPUT_BUCKET = os.environ["INPUT_BUCKET"]
    OUTPUT_BUCKET = os.environ["OUTPUT_BUCKET"]


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


@tracer.capture_method
def process_file(bucket: str, key: str) -> Dict[str, Any]:
    """Process a single file from S3."""
    try:
        # Get file from S3
        logger.info(f"Processing file: {key}")
        metrics.add_metric(name="FilesProcessed", unit=MetricUnit.Count, value=1)

        s3_response = s3_client.get_object(Bucket=bucket, Key=key)
        file_content = s3_response["Body"].read().decode("utf-8")

        system_prompt = Config.INSTRUCTIONS

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
            Bucket=Config.OUTPUT_BUCKET, Key=response_key, Body=output.encode("utf-8")
        )

        return {
            "fileName": key,
            "status": "success" if valid_response else "failed",
            "responseKey": response_key,
            "callCount": call_count,
        }

    except ClientError as e:
        logger.exception(f"AWS Error processing file {key}")
        metrics.add_metric(name="AWSErrors", unit=MetricUnit.Count, value=1)
        return {
            "fileName": key,
            "status": "error",
            "error": f"AWS Error: {str(e)}",
        }
    except Exception as e:
        logger.exception(f"Error processing file {key}")
        metrics.add_metric(name="ProcessingErrors", unit=MetricUnit.Count, value=1)
        return {"fileName": key, "status": "error", "error": str(e)}


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
