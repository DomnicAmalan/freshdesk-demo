export const generateRandomTicketDataPrompt = (ticketFields: any) => `

  Generate a single random support ticket with the given field configurations. 
  Only include fields that are marked as required (required_for_agents, required_for_customers, required_for_closure).
  If a field has predefined choices, select one randomly from the available choices.
  Ensure the output is a valid JSON object with the exact field names provided below:

    {
      "subject": "Random Subject",
      "description": "Random Random Description",
      "priority": "Choose from choice randomly if available else random",
      "status": "Choose from choice randomly if available else random must be number" ,
      "type": "Choose from choice randomly if available else random",
      "name": "Random Name",
      "email": "Random Email not johndoe@example.com",
      "phone": "Random Phone",
    }

    Choices:
    ${JSON.stringify(ticketFields)}

  Strictly Important:
  - For choices if choice data has number as key or value always use the number for value dont use string for e.g {Highest: 1, Lowest: 5} choose 1 or 5 another example {1: "Highest", 5: "Lowest"} choose 1 or 5.
  - Only return a valid JSON object without any additional text or comments.
  - Do not add any text before or after the JSON object.
  - Ensure the JSON output structure aligns with the given field configurations.
  - If a field has predefined choices, select one randomly from the available choices.
  - If a field has no predefined choices, generate a random value.
  - Strictly no other text or comments and no other text before or after the json object.
`;

export function generateTicketReplyPrompt(ticketData: any, companyInfo: any) {
    return `Generate a JSON response that mimics a Freshdesk ticket reply response.
  
The ticket is about: "${ticketData.subject}"
The ticket description is: "${ticketData.description}"

Create a helpful, professional and empathetic reply to address this customer's concern.
The reply should offer potential solutions if possible.

Return a complete JSON object with the following structure:
{
  "body": "<div>Your generated reply text here (HTML format)</div>",
  "from_email": "support@${companyInfo.companyName}.freshdesk.com",
  "cc_emails": Array of random emails,
  "bcc_emails": Array of random emails,
  "attachments": []
}

Only return the JSON object, no other text.`;
}


export const generateContactsPrompt = () => `
    Create some 5 contacts in Freshdesk with the following details:
    {
        "name": "Random Name",
        "email": "Random Email not johndoe@example.com",
        "phone": "Random Phone",
        "mobile": "Random Phone",
        "twitter_id": "Random Twitter ID",
        "unique_external_id": "Random Unique External ID",
    }
    Strictly Important:
    - Only return a valid JSON object without any additional text or comments.
    - Do not add any text before or after the JSON object.
    - Ensure the JSON output structure aligns with the given field configurations.
    - If a field has predefined choices, select one randomly from the available choices.
    - If a field has no predefined choices, generate a random value.
    - Strictly no other text or comments and no other text before or after the json object.
`;

export const generateAgentsPrompt = () => `
    Create some 5 agents in Freshdesk with the following details:
    {
        "ticket_scope": 1,
        "email": "Random Email not johndoe@example.com"
    }
    Strictly Important:
    - Only return a valid JSON object without any additional text or comments.
    - Do not add any text before or after the JSON object.
    - Ensure the JSON output structure aligns with the given field configurations.
    - If a field has predefined choices, select one randomly from the available choices.
    - If a field has no predefined choices, generate a random value.
    - Strictly no other text or comments and no other text before or after the json object.
`;