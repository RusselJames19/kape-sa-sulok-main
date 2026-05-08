FROM php:8.2-apache

# Fix MPM conflict - disable event and worker, enable prefork only
RUN apt-get update \
    && apt-get install -y default-mysql-client \
    && rm -rf /var/lib/apt/lists/* \
    && a2dismod mpm_event mpm_worker || true \
    && a2enmod mpm_prefork

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Enable mod_rewrite
RUN a2enmod rewrite

# Allow .htaccess overrides
RUN sed -i 's|AllowOverride None|AllowOverride All|g' /etc/apache2/apache2.conf

# Suppress ServerName warning
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Copy API folder to Apache web root
COPY api/ /var/www/html/

CMD ["apache2-foreground"]
