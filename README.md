# AI File Processing API

This project is an AWS-based serverless API that allows users to upload files, create inference jobs on the uploaded files, and download the processed results. The API is built using AWS Lambda functions, API Gateway, DynamoDB, S3, and SQS services.

## Architecture

The architecture consists of the following components:

1. **API Gateway**: Provides the RESTful API endpoints for the application.
2. **API Lambda Function**: Handles user authentication, file uploads, file management, and job creation.
3. **DynamoDB Tables**:
   - **Metadata Table**: Stores metadata about the uploaded files, including file ID, filename, size, and user ID.
   - **Inference Jobs Table**: Stores information about the inference jobs, including job ID, status, input files, and error messages (if any).
4. **S3 Buckets**:
   - **Input Bucket**: Stores the uploaded files.
   - **Output Bucket**: Stores the processed files (results of the inference jobs).
5. **SQS Queue**: Handles the inference job requests.
6. **Inference Lambda Function**: Processes the inference jobs by calling the Bedrock AI API and storing the results in the Output Bucket.

## API Endpoints

### `GET /files`

Lists all the files uploaded by the authenticated user.

### `POST /files`

Uploads a new file to the user's space. The file content should be base64-encoded and sent in the request body.

### `DELETE /files/{file_id}`

Deletes the specified file from the user's space.

### `POST /jobs`

Creates a new inference job for the authenticated user. The request body should contain a list of file IDs and a prompt for the AI model.

### `GET /jobs`

Lists all the inference jobs created by the authenticated user, along with their status and other details.

### `GET /jobs/{job_id}/download/{file_id}`

Generates a pre-signed URL for downloading the processed file from the specified job and file ID.

## Deployment

The project is deployed using AWS CloudFormation and the Serverless Application Model (SAM). The deployment process includes creating the necessary AWS resources (Lambda functions, API Gateway, DynamoDB tables, S3 buckets, and SQS queue) and configuring the appropriate permissions and event triggers.

```mermaid
sequenceDiagram
    participant User
    participant APIGateway
    participant APILambda
    participant DynamoDBMetadata
    participant S3InputBucket
    participant SQS
    participant InferenceLambda
    participant DynamoDBJobs
    participant S3OutputBucket
    participant BedrockAPI

    User->>APIGateway: Upload file
    APIGateway->>APILambda: Handle upload
    APILambda->>DynamoDBMetadata: Store file metadata
    APILambda->>S3InputBucket: Upload file
    User->>APIGateway: Create inference job
    APIGateway->>APILambda: Handle job creation
    APILambda->>DynamoDBMetadata: Retrieve file metadata
    APILambda->>SQS: Send job message
    APILambda->>DynamoDBJobs: Store job record
    SQS->>InferenceLambda: Trigger inference
    InferenceLambda->>DynamoDBJobs: Update job status
    InferenceLambda->>S3InputBucket: Retrieve input files
    InferenceLambda->>BedrockAPI: Call Bedrock API
    BedrockAPI-->>InferenceLambda: Inference response
    InferenceLambda->>S3OutputBucket: Store processed files
    InferenceLambda->>DynamoDBJobs: Update job status
    User->>APIGateway: Get job status
    APIGateway->>APILambda: Handle job status
    APILambda->>DynamoDBJobs: Retrieve job record
    User->>APIGateway: Download processed file
    APIGateway->>APILambda: Handle file download
    APILambda->>DynamoDBJobs: Retrieve job record
    APILambda->>S3OutputBucket: Generate presigned URL
```