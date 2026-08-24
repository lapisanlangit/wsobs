require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const app = express();
app.use(cors());
app.use(express.static("public"));

// const ALLOWED_MIMETYPES = [
//   "image/jpeg",
//   "image/png",
//   "image/webp",
//   "image/gif",
//   "image/jpg",
// ];

const ALLOWED_MIMETYPES = ["application/pdf"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Hanya boleh file PDF"), false);
    }
  },
});

const s3 = new S3Client({
  region: process.env.RUSTFS_REGION,
  endpoint: process.env.RUSTFS_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.RUSTFS_ACCESS_KEY,
    secretAccessKey: process.env.RUSTFS_SECRET_KEY,
  },
});
const BUCKET = process.env.RUSTFS_BUCKET;

//upload 1 file
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "file tidak ada" });

    const fileName = Date.now() + "-" + req.file.originalname;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }),
    );

    res.json({
      message: "berhasil upload",
      key: fileName,
      url: `${process.env.RUSTFS_ENDPOINT}/${BUCKET}/${fileName}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "gagal upload", error: err.message });
  }
});

//cek file
app.get("/files", async (req, res) => {
  const data = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET }));
  res.json(data.Contents || []);
});

//download
app.get("/download/:key", async (req, res) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: req.params.key,
    });
    const data = await s3.send(command);
    res.setHeader("Content-Type", data.ContentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${req.params.key}"`,
    );
    data.Body.pipe(res);
  } catch (err) {
    res.status(404).json({ message: "file tidak ketemu", error: err.message });
  }
});

//multiupload
app.post("/upload-multiple", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "tidak ada file" });
    }

    const uploadPromises = req.files.map(async (file) => {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${file.originalname}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: BUCKET, Key: fileName }),
        { expiresIn: 3600 },
      );
      return { key: fileName, originalName: file.originalname, url };
    });

    const results = await Promise.all(uploadPromises);
    res.json({
      message: `berhasil upload ${results.length} file`,
      files: results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "gagal", error: err.message });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File kegedean! Maksimal 1 MB per file" });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res
        .status(400)
        .json({ message: "Kebanyakan file, maksimal 10 file" });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

app.listen(3000, () => console.log("Server jalan di http://localhost:3000"));
