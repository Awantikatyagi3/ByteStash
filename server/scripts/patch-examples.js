import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_JWT = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImlhdCI6MTc4NTE1NTEzMn0.FD8iGkwbM3wWQZ791TEcO5Toj2e_ueEFj7aMlA-ln34";

const exampleDir = path.join(__dirname, '../docs/swagger_examples');

// Files that need bytestashauth
const filesToUpdateAuth = [
  'auth_verify_200.json',
  'keys_GET_200.json',
  'keys_POST_201.json',
  'keys_id_DELETE_200.json',
  'share_POST_201.json',
  'share_id_DELETE_200.json',
  'share_snippet_GET_200.json',
  'snippets_GET_200.json',
  'snippets_POST_201.json',
  'snippets_id_GET_200.json',
  'snippets_id_PUT_200.json',
  'snippets_id_DELETE_200.json'
];

filesToUpdateAuth.forEach(file => {
  const filePath = path.join(exampleDir, file);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data['http-request']) {
      if (!data['http-request'].headers) {
        data['http-request'].headers = {};
      }
      data['http-request'].headers['bytestashauth'] = VALID_JWT;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Updated ${file}`);
    }
  }
});

// Create mcp_POST_200.json
const mcpExample = {
  "http-request": {
    "method": "POST",
    "path": "/mcp",
    "headers": {
      "Content-Type": "application/json",
      "x-api-key": "OXPQD"
    },
    "body": {
      "jsonrpc": "2.0",
      "id": 1,
      "method": "initialize",
      "params": {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {
          "name": "specmatic",
          "version": "1.0.0"
        }
      }
    }
  },
  "http-response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "jsonrpc": "2.0",
      "id": 1,
      "result": {
        "protocolVersion": "2024-11-05",
        "capabilities": {
          "tools": {}
        },
        "serverInfo": {
          "name": "bytestash",
          "version": "1.0.0"
        }
      }
    }
  }
};

fs.writeFileSync(path.join(exampleDir, 'mcp_POST_200.json'), JSON.stringify(mcpExample, null, 2));
console.log('Created mcp_POST_200.json');

