# Vector Database Testing

This directory contains tools for testing vector database functionality with manual PDF data storage and retrieval.

## Files Created

### 1. VectorDBFetch.js
- **Purpose**: Real Pinecone vector database integration
- **Usage**: `npm run vector-test`
- **Requirements**: Pinecone index must be created manually in console

### 2. VectorDBFetchMock.js
- **Purpose**: Mock vector database for testing without Pinecone
- **Usage**: `npm run vector-mock`
- **Requirements**: None (works offline)

### 3. testVectorSearch.js
- **Purpose**: Comprehensive test of vector search functionality
- **Usage**: `npm run test-search`
- **Requirements**: None (uses mock database)

## Quick Start

### Option 1: Mock Database (Recommended for Testing)
```bash
# Run interactive mode
npm run vector-mock

# Or run comprehensive test
npm run test-search
```

### Option 2: Real Pinecone Database
1. Create index in Pinecone console first
2. Run: `npm run vector-test`

## Available Commands

### Interactive Mode Commands
- `store` - Store manual data in vector database
- `search <query>` - Search for data (e.g., `search authentication`)
- `stats` - Show database statistics
- `list` - List all stored data
- `clear` - Clear all manual data
- `exit` - Exit the program

### Example Usage
```bash
# Start interactive mode
npm run vector-mock

# In the interactive mode:
Enter command: store
Enter command: search authentication
Enter command: search database configuration
Enter command: stats
Enter command: exit
```

## How It Works

### 1. Data Storage
- Manual data is converted to vector embeddings
- Each document gets a unique ID and metadata
- Vectors are stored with similarity search capability

### 2. Data Retrieval
- Search queries are converted to vector embeddings
- Cosine similarity is calculated between query and stored vectors
- Results are ranked by relevance score (0-1)

### 3. Sample Data
The system comes with 8 sample manual entries:
- Getting Started Guide
- User Authentication
- API Documentation
- Database Configuration
- Troubleshooting
- Installation Guide
- Configuration Settings
- Security Best Practices

## Test Results

The system successfully demonstrates:
- ✅ Vector storage and retrieval
- ✅ Semantic search functionality
- ✅ Relevance scoring
- ✅ Multiple query types
- ✅ Data management (store, clear, list)

## Next Steps

1. **For Production**: Set up real Pinecone index and use `VectorDBFetch.js`
2. **For Development**: Use `VectorDBFetchMock.js` for testing
3. **For PDF Integration**: Replace sample data with actual PDF content extraction
4. **For Better Embeddings**: Integrate with OpenAI/Cohere embedding services

## Troubleshooting

### Mock Database Issues
- No troubleshooting needed - works offline

### Pinecone Database Issues
- Ensure index exists in Pinecone console
- Check API key and environment configuration
- Verify network connectivity

## File Structure
```
fixit-backend/
├── VectorDBFetch.js          # Real Pinecone integration
├── VectorDBFetchMock.js      # Mock database for testing
├── testVectorSearch.js       # Comprehensive test script
├── VECTOR_DB_TEST_README.md  # This file
└── package.json              # Updated with new scripts
```
