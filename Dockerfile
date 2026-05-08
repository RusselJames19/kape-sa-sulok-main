FROM php:8.2-apache

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Install mysqldump
RUN apt-get update && apt-get install -y default-mysql-client && rm -rf /var/lib/apt/lists/*

# Copy API folder to Apache web root
COPY api/ /var/www/html/

# Enable Apache mod_rewrite for routing
RUN a2enmod rewrite

# Apache config to allow .htaccess
RUN echo '<Directory /var/www/html>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' > /etc/apache2/conf-available/api.conf \
&& a2enconf api

EXPOSE 80
