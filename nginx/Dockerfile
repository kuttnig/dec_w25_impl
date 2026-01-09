FROM nginx:1.27-alpine

# We generate a self-signed certificate inside the image.
# This is fine for our demo (ofc NOT production rdy :D ).
RUN apk add --no-cache openssl

RUN mkdir -p /etc/nginx/certs && \
    openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
      -keyout /etc/nginx/certs/marktverbund25.key \
      -out /etc/nginx/certs/marktverbund25.crt \
      -subj "/C=AT/ST=Vienna/L=Vienna/O=marktverbund25.at/OU=dev/CN=marktverbund25.at" \
      -addext "subjectAltName=DNS:marktverbund25.at,DNS:localhost,IP:127.0.0.1"

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 443
