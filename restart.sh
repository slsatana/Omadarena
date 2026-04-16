#!/bin/bash
cd /home/timur_admin/omadarena
sudo docker-compose build backend
sudo lsof -i :3000 -t | xargs -r sudo kill -9
sudo docker rm -f $(sudo docker ps -aq -f name=backend)
sudo docker-compose up -d backend
echo "===AGENT COMMAND DONE===" >> /home/timur_admin/.agents/tmp/ag_output_08b7f3c7-102c-42ca-b745-8b8381f20101.txt
