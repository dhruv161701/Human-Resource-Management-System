import os
import uuid
from datetime import datetime, timedelta
from google.cloud import storage
from google.oauth2 import service_account
from config import Config


class GCSService:
    _instance = None
    _client = None
    _bucket = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GCSService, cls).__new__(cls)
            cls._instance._initialize_client()
        return cls._instance

    def _initialize_client(self):
        """Initialize Google Cloud Storage client"""
        try:
            # Try to use default credentials or service account
            credentials_path = os.path.join(os.path.dirname(__file__), '..', 'gcs-credentials.json')
            
            if os.path.exists(credentials_path):
                credentials = service_account.Credentials.from_service_account_file(credentials_path)
                self._client = storage.Client(credentials=credentials, project=Config.GCS_PROJECT_ID)
            else:
                # Use default credentials
                self._client = storage.Client(project=Config.GCS_PROJECT_ID)
            
            # Get or create bucket
            try:
                self._bucket = self._client.get_bucket(Config.GCS_BUCKET_NAME)
            except Exception:
                # Bucket doesn't exist, create it
                self._bucket = self._client.create_bucket(Config.GCS_BUCKET_NAME, location='US')
                print(f"Created bucket: {Config.GCS_BUCKET_NAME}")
                
        except Exception as e:
            print(f"Warning: Could not initialize GCS client: {e}")
            self._client = None
            self._bucket = None

    def upload_file(self, file_data, filename, content_type, employee_id):
        """Upload a file to Google Cloud Storage"""
        if not self._bucket:
            return None, "GCS not configured"
        
        try:
            # Generate unique filename
            file_extension = os.path.splitext(filename)[1]
            unique_filename = f"{employee_id}/{uuid.uuid4()}{file_extension}"
            
            blob = self._bucket.blob(unique_filename)
            blob.upload_from_string(file_data, content_type=content_type)
            
            # Make the blob publicly accessible or generate signed URL
            blob.make_public()
            
            return {
                'url': blob.public_url,
                'filename': filename,
                'gcs_path': unique_filename,
                'uploaded_at': datetime.utcnow().isoformat()
            }, None
            
        except Exception as e:
            return None, str(e)

    def delete_file(self, gcs_path):
        """Delete a file from Google Cloud Storage"""
        if not self._bucket:
            return False, "GCS not configured"
        
        try:
            blob = self._bucket.blob(gcs_path)
            blob.delete()
            return True, None
        except Exception as e:
            return False, str(e)

    def get_signed_url(self, gcs_path, expiration_minutes=60):
        """Generate a signed URL for temporary access"""
        if not self._bucket:
            return None, "GCS not configured"
        
        try:
            blob = self._bucket.blob(gcs_path)
            url = blob.generate_signed_url(
                version="v4",
                expiration=timedelta(minutes=expiration_minutes),
                method="GET"
            )
            return url, None
        except Exception as e:
            return None, str(e)


# Singleton instance
gcs_service = GCSService()
