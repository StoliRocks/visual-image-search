# Visual Image Search

A full-stack application for finding visually similar images using deep learning. The system uses a ResNet101 CNN for feature extraction, Amazon SageMaker for model hosting, and Amazon OpenSearch for k-nearest neighbor (KNN) vector similarity search.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│ API Gateway │────▶│   Lambda    │────▶│  SageMaker  │
│  Frontend   │     │             │     │             │     │  Endpoint   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐     ┌─────────────┐
                                        │  OpenSearch │────▶│     S3      │
                                        │  KNN Index  │     │   Images    │
                                        └─────────────┘     └─────────────┘
```

## How It Works

1. **Feature Extraction**: Images are processed through a ResNet101 CNN, generating 2048-dimensional feature vectors
2. **Indexing**: Feature vectors are stored in an OpenSearch KNN index for efficient similarity search
3. **Querying**: When a user uploads an image, the system:
   - Extracts features using SageMaker
   - Queries OpenSearch for k-nearest neighbors
   - Returns presigned URLs to similar images from S3

## Tech Stack

### Backend
- **Python 3.12** - Runtime for Lambda and SageMaker inference
- **TensorFlow 2.15+** - Deep learning framework
- **AWS Lambda** - Serverless API backend
- **Amazon SageMaker** - ML model hosting
- **Amazon OpenSearch** - Vector similarity search (KNN)
- **AWS SAM** - Infrastructure as Code

### Frontend
- **React 18** - UI framework
- **Material UI 5** - Component library
- **AWS Amplify 6** - AWS SDK integration
- **Vite** - Build tool and dev server
- **Vitest** - Testing framework

## Prerequisites

- Node.js 20+
- Python 3.12+
- AWS CLI configured with appropriate credentials
- AWS SAM CLI

## Project Structure

```
visual-image-search/
├── src/                    # SageMaker inference code
│   ├── inference.py        # TensorFlow model handlers
│   └── requirements.txt    # Python dependencies
├── backend/                # Lambda backend
│   ├── lambda/
│   │   ├── app.py          # Lambda handler
│   │   └── requirements.txt
│   └── template.yaml       # SAM template
├── frontend/               # React application
│   ├── src/
│   │   ├── App.js          # Main component
│   │   └── index.js        # Entry point
│   ├── package.json
│   └── vite.config.js
├── cfn/                    # CloudFormation templates
│   └── initial_template.yaml
├── .github/workflows/      # CI/CD pipelines
│   └── ci.yml
└── pyproject.toml          # Python tooling config
```

## Quick Start

### 1. Deploy Infrastructure

Use the CloudFormation template to create the required AWS resources:

```bash
aws cloudformation create-stack \
  --stack-name visual-image-search \
  --template-body file://cfn/initial_template.yaml \
  --capabilities CAPABILITY_IAM
```

### 2. Deploy Backend

```bash
cd backend
sam build
sam deploy --guided
```

Note the API Gateway endpoint URL from the outputs.

### 3. Run Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "REACT_APP_API_ENDPOINT=<your-api-gateway-url>" > .env

# Start development server
npm run dev
```

### 4. Index Images

Use the Jupyter notebook (`visual-image-search.ipynb`) to:
1. Train/load the ResNet101 model
2. Extract features from your image dataset
3. Index features in OpenSearch

## Development

### Frontend Commands

```bash
npm run dev         # Start development server
npm run build       # Production build
npm run test        # Run tests
npm run lint        # Run ESLint
npm run format      # Format code with Prettier
```

### Python Linting

```bash
# Install ruff
pip install ruff

# Lint code
ruff check src/ backend/lambda/

# Format code
ruff format src/ backend/lambda/
```

## API Endpoints

### POST /postImage
Search by uploading a base64-encoded image.

```json
{
  "base64img": "<base64-encoded-image>",
  "k": 3
}
```

### POST /postURL
Search by providing a public image URL.

```json
{
  "url": "https://example.com/image.jpg",
  "k": 3
}
```

### Response

```json
{
  "images": [
    "https://s3.amazonaws.com/...",
    "https://s3.amazonaws.com/...",
    "https://s3.amazonaws.com/..."
  ]
}
```

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `REACT_APP_API_ENDPOINT` | API Gateway endpoint URL |
| `ES_ENDPOINT` | OpenSearch domain endpoint (Lambda) |
| `SM_ENDPOINT` | SageMaker endpoint name (Lambda) |

## Testing

### Frontend Tests

```bash
cd frontend
npm test              # Watch mode
npm test -- --run     # Single run
npm run test:coverage # With coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
