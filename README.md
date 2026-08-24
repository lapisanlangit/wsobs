Running Docker Object Storage RustFS :
=======

&#x20; docker run -d --name rustfs -p 9000:9000 -p 9001:9001 -v rustfs-data:/data -e RUSTFS\_ACCESS\_KEY=rustfsadmin -e RUSTFS\_SECRET\_KEY=rustfsadmin quay.io/rustfs/rustfs

buat bucket dengan nama foto-saya

Running :
=======

&#x20; npm install

Upload Single File pdf:
=======

&#x20; http://localhost:3000/upload.html

Upload Multiple File pdf :
=======

&#x20; http://localhost:3000/multiupload.html

Download
=======

&#x20; http://localhost:3000/download/<<namafile.pdf>>

Logging ke MongoDB
=======

docker run -d --name mongodb -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password123 -e MONGO_INITDB_DATABASE=logs mongo:latest

buat database dengan nama : logs dan collection: dengan nama app_logs

&#x20; http://localhost:3000/logmongo.html
