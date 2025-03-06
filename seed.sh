#!/bin/bash

# Function to add a company configuration
add_company() {
  local freshdesk_url=$1
  local api_key=$2
  local ticket_create_interval=$3
  local ticket_reply_interval=$4
  local tickets_per_day=$5

  # Check if all parameters are provided
  if [ -z "$freshdesk_url" ] || [ -z "$api_key" ] || [ -z "$ticket_create_interval" ] || [ -z "$ticket_reply_interval" ] || [ -z "$tickets_per_day" ]; then
    echo "Error: Missing parameters. Usage: ./seed.sh <freshdesk_url> <api_key> <ticket_create_interval> <ticket_reply_interval> <tickets_per_day>"
    exit 1
  fi

  echo "Adding company configuration to Freshdesk..."

  curl -X POST http://localhost:3034/freshdesk/config \
    -H "Content-Type: application/json" \
    -d "{
      \"freshdeskUrl\": \"$freshdesk_url\",
      \"apiKey\": \"$api_key\",
      \"ticketCreateInterval\": $ticket_create_interval,
      \"ticketReplyInterval\": $ticket_reply_interval,
      \"ticketsPerDay\": $tickets_per_day
    }"
}

# Main script execution
add_company "https://licetac.freshdesk.com" "N9g3uXnUFcW2FEhZC" 300 120 10 