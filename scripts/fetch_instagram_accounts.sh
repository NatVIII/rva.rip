#!/bin/bash

# Get the list of usernames from command-line arguments
usernames=("$@")

# Define the access token
access_token=$INSTAGRAM_USER_ACCESS_TOKEN

# Loop through each username and fetch the data
for username in "${usernames[@]}"
do
  url="https://graph.facebook.com/v16.0/17841448413588338?fields=business_discovery.username(${username}){media.limit(5){caption,permalink,timestamp,media_type,media_url,children{media_url}}}&access_token=${access_token}"
  encoded_url=$(echo $url | sed 's/{/%7B/g' | sed 's/}/%7D/g')
  response=$(curl -sS $encoded_url)

  # Check if the request was successful
  if [[ $(echo $response | jq -r '.error') == "null" ]]
  then
    # echo "Data fetched successfully for username: ${username}"
    : # do nothing.
  else
    error_msg=$(echo $response | jq -r '.error.error_user_msg')
    echo "Error fetching data for username: ${username}"
    echo $error_msg
  fi
  # # Log the X-App-Usage header information
  # x_app_usage=$(echo $response | grep -i 'X-App-Usage')
  # echo "X-App-Usage for username ${username}: ${x_app_usage}"
done

