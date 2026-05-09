FROM php:8.2-cli

# Install PHP extensions and mysqldump
RUN apt-get update && apt-get install -y \
    default-mysql-client \
    libonig-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring fileinfo \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY api/ ./api/

EXPOSE $PORT

CMD php -S 0.0.0.0:${PORT:-8080} -t /app/api
