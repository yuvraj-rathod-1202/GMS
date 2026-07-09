FROM ubuntu:22.04

# Install required tools for backup operations
RUN apt-get update && apt-get install -y \
    mysql-client-8.0 \
    rclone \
    gzip \
    curl \
    bash \
    coreutils \
    && rm -rf /var/lib/apt/lists/*

# Create backup directory
RUN mkdir -p /backup

# Copy backup script
COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

# Set working directory
WORKDIR /backup

# Default command runs the backup script
ENTRYPOINT ["/usr/local/bin/backup.sh"]
