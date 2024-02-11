from flask import Flask, render_template, request
from openai import OpenAI
import json

client = OpenAI()

app = Flask(__name__)

@app.route('/')
def hello_world():
    return render_template('index.html')

@app.route('/complyte', methods=['POST'])
def complyte():
    message = request.json.get('message')

    if not message:
        return {
            "error": "No message provided"
        }, 400

    response = client.chat.completions.create(
        model="gpt-3.5-turbo-0125",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": """You are an email autocompletion generator. Generate a list of possible things the email author might want to type next. Provide the full sentence, even the part the user has typed already. Use the JSON format: {\"competions\": []}

The completions should only have the last sentence in them. They should match exactly the beginning part of the last sentence the user typed.

Example:
Message: Hello! I joined a meeting with your company yester. I would like to apologize for my
Response: {\"completions\": [\"I would like to apologize for my behavior yesterday\", \"I would like to apologize for my actions yesterday\", \"I would like to apologize for my conduct yesterday\"]}"""
            },
            {
                "role": "user",
                "content": message
            }
        ]
    )

    response_message = response.choices[0].message
    message_json = response_message.content

    return json.loads(message_json)

if __name__ == '__main__':
    app.run(debug=True)
