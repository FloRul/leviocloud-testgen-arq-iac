export interface Job {
  job_error: string;
  updated_at: number;
  user_id: string;
  created_at: number;
  input_files: ServerFile[];
  prompt: string;
  job_id: string;
  job_status: "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR";
}

export interface ServerFile {
  filename: string;
  size: number;
  user_id: string;
  last_modified: number;
  s3_key?: string;
  content_type: "application/octet-stream";
  file_id: string;
}
