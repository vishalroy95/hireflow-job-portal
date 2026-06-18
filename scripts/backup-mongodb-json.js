const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const mongoose = require(path.join(rootDir, 'job_portal_backend', 'node_modules', 'mongoose'));
const dotenv = require(path.join(rootDir, 'job_portal_backend', 'node_modules', 'dotenv'));
const envPath = path.join(rootDir, 'job_portal_backend', '.env');
dotenv.config({ path: envPath });

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!mongoUri) {
  console.error('MongoDB URI not found in job_portal_backend/.env');
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(rootDir, 'backups', `mongodb-${timestamp}`);

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const backup = async () => {
  fs.mkdirSync(backupDir, { recursive: true });

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 15000,
  });

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const metadata = {
    createdAt: new Date().toISOString(),
    database: db.databaseName,
    collections: [],
  };

  for (const collectionInfo of collections) {
    const collectionName = collectionInfo.name;
    const documents = await db.collection(collectionName).find({}).toArray();
    const fileName = `${collectionName}.json`;

    writeJson(path.join(backupDir, fileName), documents);
    metadata.collections.push({
      name: collectionName,
      file: fileName,
      count: documents.length,
    });
  }

  writeJson(path.join(backupDir, 'metadata.json'), metadata);
  await mongoose.disconnect();

  console.log(`Backup created: ${backupDir}`);
  console.log(`Collections exported: ${metadata.collections.length}`);
  console.log(`Documents exported: ${metadata.collections.reduce((sum, item) => sum + item.count, 0)}`);
};

backup().catch(async (error) => {
  try {
    await mongoose.disconnect();
  } catch (_) {
    // Ignore disconnect errors during failed backup cleanup.
  }

  console.error(error.message || 'Backup failed');
  process.exit(1);
});
