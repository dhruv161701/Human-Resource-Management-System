"""Azure Blob Storage Service for document uploads"""
from azure.storage.blob import BlobServiceClient, ContentSettings
from datetime import datetime, timedelta
import os
import uuid

class AzureStorageService:
    def __init__(self):
        self.connection_string = os.environ.get('AZURE_STORAGE_CONNECTION_STRING')
        self.container_name = os.environ.get('AZURE_STORAGE_CONTAINER_NAME', 'dayflow-hrms')
        self.blob_service_client = None
        self.container_client = None
        
        if self.connection_string:
            try:
                self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
                self.container_client = self.blob_service_client.get_container_client(self.container_name)
                # Create container if it doesn't exist
                try:
                    self.container_client.create_container()
                    print(f"Created Azure container: {self.container_name}")
                except Exception:
                    # Container already exists
                    pass
                print("Azure Blob Storage initialized successfully")
            except Exception as e:
                print(f"Failed to initialize Azure Blob Storage: {e}")
        else:
            print("Azure Storage connection string not configured")

    def upload_file(self, file_data, filename, content_type, employee_id):
        """Upload a file to Azure Blob Storage
        
        Args:
            file_data: File bytes
            filename: Original filename
            content_type: MIME type of the file
            employee_id: Employee ID for organizing files
            
        Returns:
            tuple: (result_dict, error_string)
        """
        if not self.blob_service_client:
            return None, "Azure Storage not configured"
        
        try:
            # Generate unique blob name
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_id = str(uuid.uuid4())[:8]
            file_ext = os.path.splitext(filename)[1] if '.' in filename else ''
            blob_name = f"documents/{employee_id}/{timestamp}_{unique_id}{file_ext}"
            
            # Get blob client
            blob_client = self.container_client.get_blob_client(blob_name)
            
            # Set content settings
            content_settings = ContentSettings(content_type=content_type)
            
            # Upload the file
            blob_client.upload_blob(
                file_data,
                content_settings=content_settings,
                overwrite=True
            )
            
            # Get the URL
            url = blob_client.url
            
            return {
                'url': url,
                'blob_name': blob_name,
                'filename': filename
            }, None
            
        except Exception as e:
            print(f"Azure upload error: {e}")
            return None, str(e)

    def delete_file(self, blob_name):
        """Delete a file from Azure Blob Storage
        
        Args:
            blob_name: The blob name to delete
            
        Returns:
            tuple: (success_bool, error_string)
        """
        if not self.blob_service_client:
            return False, "Azure Storage not configured"
        
        try:
            blob_client = self.container_client.get_blob_client(blob_name)
            blob_client.delete_blob()
            return True, None
        except Exception as e:
            print(f"Azure delete error: {e}")
            return False, str(e)

    def get_file_url(self, blob_name):
        """Get the URL for a blob
        
        Args:
            blob_name: The blob name
            
        Returns:
            str: The blob URL
        """
        if not self.blob_service_client:
            return None
        
        try:
            blob_client = self.container_client.get_blob_client(blob_name)
            return blob_client.url
        except Exception as e:
            print(f"Azure get URL error: {e}")
            return None


# Singleton instance
azure_storage = AzureStorageService()
