# Chat App Project

The complete project is build by using MERN stack technologies

## setup

1. Run `npm install`
2. Add your all secret things in `.env` file for that you can check .envExample file

## Admin auth

1.

# Deployement Process and Commands

- We need to allow IPs in the MongoDB atlas for accessing db
- npm install pm2 -g (For running our application 24/7)
- pm2 start npm -- start
- pm2 logs
- pm2 list, pm2 flush < App name >, pm2 stop < App name >, pm2 delete < App name >
- Now we need to configure a port no. to "/api"
- Frontend will run on nexchat.com
- Backend will run on nexchat.com/api => here we have to make DNS mapping from port 7777 to "/api"
- We should have to config in nginx by below instructions
- For that we need make some changes in the /etc/nginx/sites-available/default
  command (sudo nano /etc/nginx/sites-available/default)

server {
listen 80;
server_name 13.49.64.158;

    location /api/ {
        proxy_pass http://127.0.0.1:7217/;

        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

}

after completion of the configrations 
we need to restart the nginx again.
- if you do not restart nginx things will not work
- sudo systemctl restart nginx
