# Google Cloud Storage Setup Guide

This guide explains how to configure Google Cloud Storage (GCS) for the Dayflow HRMS document upload feature.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. A GCP project created
3. Billing enabled on the project

## Step 1: Create a Cloud Storage Bucket

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Storage** → **Buckets**
3. Click **Create Bucket**
4. Configure the bucket:
   - **Name**: `dayflow-hrms-documents` (or your preferred name)
   - **Location type**: Choose based on your needs (Region recommended for cost)
   - **Storage class**: Standard
   - **Access control**: Fine-grained (recommended) or Uniform
5. Click **Create**

## Step 2: Create a Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Fill in details:
   - **Name**: `hrms-storage-service`
   - **Description**: Service account for HRMS document uploads
4. Click **Create and Continue**
5. Grant roles:
   - **Storage Object Admin** (for full object access)
   - Or **Storage Object Creator** + **Storage Object Viewer** (more restrictive)
6. Click **Continue** → **Done**

## Step 3: Create Service Account Key

1. Click on the created service account
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Select **JSON** format
5. Click **Create**
6. Save the downloaded JSON file securely (e.g., `gcs-credentials.json`)

## Step 4: Configure CORS (for browser uploads)

1. Create a file named `cors.json`:
```json
[
  {
    "origin": ["http://localhost:5173", "http://localhost:5174", "https://your-domain.com"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent"],
    "maxAgeSeconds": 3600
  }
]
```

2. Apply CORS configuration using gsutil:
```bash
gsutil cors set cors.json gs://dayflow-hrms-documents
```

## Step 5: Set Bucket Permissions (Optional - for public read access)

If you want uploaded documents to be publicly readable:

1. Go to your bucket → **Permissions**
2. Click **Grant Access**
3. Add principal: `allUsers`
4. Role: **Storage Object Viewer**
5. Click **Save**

**Note**: For sensitive documents, keep the bucket private and use signed URLs instead.

## Step 6: Configure Environment Variables

Add the following to your `.env` file:

```env
# Google Cloud Storage Configuration
GCS_BUCKET_NAME=dayflow-hrms-documents
GCS_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/gcs-credentials.json
```

Or set the credentials directly:
```env
x-goog-project-id=your-project-id
google_cloud_storage_account=your-service-account@your-project.iam.gserviceaccount.com
```

## Step 7: Update Backend Configuration

Update `backend/config.py` to include GCS settings:

```python
class Config:
    # ... existing config ...
    
    # Google Cloud Storage
    GCS_BUCKET_NAME = os.getenv('GCS_BUCKET_NAME', 'dayflow-hrms-documents')
    GCS_PROJECT_ID = os.getenv('GCS_PROJECT_ID', os.getenv('x-goog-project-id'))
```

## Step 8: Install Required Python Package

```bash
pip install google-cloud-storage
```

## File Structure in GCS

Documents are organized as follows:
```
dayflow-hrms-documents/
├── profile-pictures/
│   └── {employee_id}/
│       └── profile.jpg
├── documents/
│   └── {employee_id}/
│       ├── aadhar_card.pdf
│       ├── pan_card.pdf
│       └── ...
```

## Security Best Practices

1. **Never commit credentials**: Add `*.json` credentials to `.gitignore`
2. **Use IAM roles**: Prefer IAM roles over service account keys in production
3. **Enable audit logging**: Track who accesses what
4. **Set lifecycle rules**: Auto-delete old/temporary files
5. **Enable versioning**: For document recovery
6. **Use signed URLs**: For temporary access to private files

## Troubleshooting

### Error: "Could not automatically determine credentials"
- Ensure `GOOGLE_APPLICATION_CREDENTIALS` environment variable is set
- Or place the credentials JSON in the backend folder

### Error: "Access Denied"
- Check service account has correct roles
- Verify bucket permissions
- Check if bucket name is correct

### Error: "Bucket not found"
- Verify bucket name in configuration
- Check if bucket exists in the correct project

## Testing the Setup

Run this Python script to test:

```python
from google.cloud import storage

def test_gcs():
    client = storage.Client()
    bucket = client.bucket('dayflow-hrms-documents')
    
    # Test upload
    blob = bucket.blob('test/test.txt')
    blob.upload_from_string('Hello, GCS!')
    print(f"Uploaded: {blob.public_url}")
    
    # Test download
    content = blob.download_as_string()
    print(f"Downloaded: {content}")
    
    # Cleanup
    blob.delete()
    print("Test successful!")

if __name__ == '__main__':
    test_gcs()
```

## Cost Considerations

- **Storage**: ~$0.020/GB/month (Standard class)
- **Operations**: ~$0.05 per 10,000 operations
- **Network**: Free within same region, charges for external

For a small HRMS with ~100 employees and average 5 documents each:
- Estimated storage: ~500MB = ~$0.01/month
- Operations: Minimal cost

## Alternative: Using Firebase Storage

If you prefer Firebase (simpler setup):

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create/select project
3. Go to **Storage** → **Get Started**
4. Update security rules as needed
5. Use Firebase Admin SDK in Python

```python
import firebase_admin
from firebase_admin import credentials, storage

cred = credentials.Certificate('firebase-credentials.json')
firebase_admin.initialize_app(cred, {'storageBucket': 'your-bucket.appspot.com'})

bucket = storage.bucket()
```
