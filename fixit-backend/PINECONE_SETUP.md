# Pinecone Vector Database Setup

This document explains how to set up and use Pinecone vector database in the Fixit application.

## Overview

Pinecone is integrated into the Fixit backend to provide vector search capabilities for:
- Chat message similarity search
- Document retrieval
- AI-powered recommendations
- Context-aware responses

## Prerequisites

1. **Pinecone Account**: Sign up at [pinecone.io](https://pinecone.io)
2. **API Key**: Get your API key from the Pinecone console
3. **Environment**: Note your Pinecone environment (e.g., `us-east-1-aws`)

## Installation

The Pinecone dependency is already added to `package.json`. Install it by running:

```bash
npm install
```

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```env
# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment_here
PINECONE_INDEX_NAME=fixit-chat-index
PINECONE_DIMENSION=1536
PINECONE_METRIC=cosine
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1
```

### Required Variables

- `PINECONE_API_KEY`: Your Pinecone API key
- `PINECONE_ENVIRONMENT`: Your Pinecone environment

### Optional Variables

- `PINECONE_INDEX_NAME`: Index name (default: `fixit-chat-index`)
- `PINECONE_DIMENSION`: Vector dimension (default: `1536`)
- `PINECONE_METRIC`: Distance metric (default: `cosine`)
- `PINECONE_CLOUD`: Cloud provider (default: `aws`)
- `PINECONE_REGION`: Region (default: `us-east-1`)

## Setup

### 1. Test Connection

First, test your Pinecone connection:

```bash
npm run test-pinecone
```

This will verify your API key and environment configuration.

### 2. Create Index in Pinecone Console

Since you don't have pod quota available, you need to create a serverless index manually:

1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Click "Create Index"
3. Choose "Serverless" as the compute type
4. Set the following:
   - **Name**: `fixit-manual` (or match your PINECONE_INDEX_NAME)
   - **Dimensions**: `1024` (or match your PINECONE_DIMENSION)
   - **Metric**: `cosine`
   - **Cloud**: `AWS`
   - **Region**: `us-east-1`

### 3. Run the Setup Script

After creating the index manually:

```bash
npm run setup-pinecone
```

This script will:
- Validate your configuration
- Initialize the Pinecone service
- Connect to your existing index
- Display index statistics

### 4. Manual Setup

If you prefer to set up manually:

```javascript
const pineconeService = require('./services/pineconeService');

// Initialize the service
await pineconeService.initialize();

// The service will automatically connect to your existing index
```

## Usage

### Basic Operations

```javascript
const pineconeService = require('./services/pineconeService');
const PineconeUtils = require('./utils/pineconeUtils');

// Store vectors
const vectors = [
    {
        id: 'vec_1',
        values: [0.1, 0.2, 0.3, ...], // 1536-dimensional vector
        metadata: { userId: 'user123', content: 'Hello world' }
    }
];
await pineconeService.upsertVectors(vectors);

// Search similar vectors
const queryVector = [0.1, 0.2, 0.3, ...];
const results = await pineconeService.queryVectors(queryVector, 5);
```

### Using Utility Functions

```javascript
// Store chat message vectors
const messages = [
    { id: 'msg1', content: 'Hello', embedding: [0.1, 0.2, ...] },
    { id: 'msg2', content: 'World', embedding: [0.3, 0.4, ...] }
];
await PineconeUtils.storeMessageVectors(messages, 'user123', 'session456');

// Search similar messages
const queryVector = [0.1, 0.2, 0.3, ...];
const similar = await PineconeUtils.searchSimilarMessages(
    queryVector, 
    'user123', 
    'session456', 
    5
);
```

## API Endpoints

The following endpoints are available for vector operations:

### POST /api/vectors/initialize
Initialize the Pinecone service

### GET /api/vectors/status
Check if Pinecone service is available

### GET /api/vectors/stats
Get index statistics

### POST /api/vectors/search
Search for similar vectors
```json
{
    "queryVector": [0.1, 0.2, 0.3, ...],
    "topK": 5,
    "type": "message"
}
```

### POST /api/vectors/store
Store vectors
```json
{
    "vectors": [
        {
            "id": "vec_1",
            "values": [0.1, 0.2, 0.3, ...],
            "metadata": { "content": "Hello world" }
        }
    ]
}
```

## Integration with Existing Code

To integrate Pinecone with your existing chat functionality:

1. **Generate Embeddings**: Use an embedding service (OpenAI, Cohere, etc.) to convert text to vectors
2. **Store Vectors**: Store message embeddings when saving chat messages
3. **Search Vectors**: Query similar messages for context-aware responses

Example integration:

```javascript
// In your chat controller
const { generateEmbedding } = require('./services/embeddingService');
const PineconeUtils = require('./utils/pineconeUtils');

// When saving a message
const message = {
    content: userMessage,
    userId: req.user.id,
    chatSessionId: sessionId
};

// Generate embedding
const embedding = await generateEmbedding(message.content);

// Store in Pinecone
await PineconeUtils.storeMessageVectors([{
    ...message,
    embedding
}], message.userId, message.chatSessionId);
```

## Troubleshooting

### Common Issues

1. **Configuration Error**: Ensure all required environment variables are set
2. **API Key Invalid**: Verify your Pinecone API key is correct
3. **Index Not Found**: Run the setup script to create the index
4. **Dimension Mismatch**: Ensure your vectors match the configured dimension

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment.

### Support

For Pinecone-specific issues, refer to:
- [Pinecone Documentation](https://docs.pinecone.io/)
- [Pinecone Console](https://app.pinecone.io/)

## Files Created

- `services/pineconeService.js` - Main Pinecone service
- `utils/pineconeUtils.js` - Utility functions
- `controllers/vectorController.js` - API controllers
- `routes/vectorRoutes.js` - API routes
- `config/pinecone.js` - Configuration
- `scripts/setupPinecone.js` - Setup script

## Next Steps

1. Set up your Pinecone account and get API credentials
2. Configure environment variables
3. Run the setup script
4. Integrate with your chat functionality
5. Test the vector search capabilities
