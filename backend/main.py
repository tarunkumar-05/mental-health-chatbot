from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from transformers import pipeline
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

sentiment_analyzer = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english"
)

class Message(BaseModel):
    text: str

SYSTEM_PROMPT = """You are a compassionate mental health support chatbot. 
Your role is to:
- Listen empathetically to users
- Provide emotional support and encouragement
- Suggest healthy coping strategies
- Never diagnose or replace professional help
- Always recommend professional help for serious issues
- Keep responses concise, warm and supportive
"""

@app.get("/")
def home():
    return {"status": "Mental Health Chatbot API is running!"}

@app.post("/chat")
async def chat(message: Message):
    sentiment_result = sentiment_analyzer(message.text)[0]
    sentiment = sentiment_result["label"]
    score = round(sentiment_result["score"] * 100, 2)

    prompt = f"""{SYSTEM_PROMPT}
    
User's emotional state detected: {sentiment} (confidence: {score}%)
User message: {message.text}

Respond with empathy based on their emotional state."""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    
    return {
        "response": response.text,
        "sentiment": sentiment,
        "confidence": score
    }