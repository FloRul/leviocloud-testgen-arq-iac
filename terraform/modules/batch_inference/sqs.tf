resource "aws_sqs_queue" "batch_inference_queue" {
  name = "${var.project_name}-${var.environment}-batch-inference-queue"
}
