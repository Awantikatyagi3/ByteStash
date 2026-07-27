const fs = require('fs');
const path = require('path');

const exampleDir = path.join(__dirname, '../docs/swagger_examples');

// Update DELETE examples to use ID 2 for snippets and keys, and 124 for shares
function updateExamplePath(fileName, newPath) {
  const filePath = path.join(exampleDir, fileName);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data['http-request']) {
      data['http-request'].path = newPath;
    }
    // For snippets and keys, the response body contains the ID
    if (data['http-response'] && data['http-response'].body && data['http-response'].body.id !== undefined) {
      if (fileName.includes('share')) {
        data['http-response'].body.id = "124";
      } else {
        data['http-response'].body.id = 2;
      }
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated path in ${fileName}`);
  }
}

updateExamplePath('snippets_id_DELETE_200.json', '/api/snippets/2');
updateExamplePath('keys_id_DELETE_200.json', '/api/keys/2');
updateExamplePath('share_id_DELETE_200.json', '/api/share/124');

