#!/bin/bash
set -e
/etc/init.d/postgresql start
su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\""
su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname = 'ielts_db'\" | grep -q 1 || psql -c \"CREATE DATABASE ielts_db;\""
su - postgres -c "psql -d ielts_db -c \"CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS \\\"uuid-ossp\\\";\""
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/16/main/postgresql.conf
echo 'host all all 0.0.0.0/0 md5' >> /etc/postgresql/16/main/pg_hba.conf
echo 'host all all 127.0.0.1/32 md5' >> /etc/postgresql/16/main/pg_hba.conf
echo 'host all all ::1/128 md5' >> /etc/postgresql/16/main/pg_hba.conf
/etc/init.d/postgresql restart
echo "POSTGRES_SETUP_COMPLETED_SUCCESSFULLY"

